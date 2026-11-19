# AI Assist backend for Node.js (Express)

A complete server for the `aiAssistRequest` client in [../SKILL.md](../SKILL.md). It keeps provider keys on the server and handles every request Froala 5.6.0 sends through `aiAssistRequest`: AI Assist prompts, tone, translate, Improve Writing, AI Chat (streamed, with files and web search), inline suggestions and speech-to-text.

How it was checked: run with the client from SKILL.md against Froala 5.6.0 in Chromium, with the provider APIs replaced by a local mock (streamed and non-streamed text, dictation, two AI Chat questions keeping one `session_id`). SDK method names were checked in `@anthropic-ai/sdk` 1.10.0, `openai` 7.60.0, `express` 5.3.0 and `express-rate-limit` 8.7.5. Model IDs change: confirm them in each provider's model list before deploying.

## What it does

| Froala request | Server behaviour |
|---|---|
| `speechToText: true` | Decodes the base64 WAV and transcribes it (OpenAI here; any speech-to-text API works). Returns `{ answer: transcript }` |
| `autoComplete: true` (inline suggestions) | Fast model, no extended reasoning, 64 output tokens |
| Everything else | Sends `data.prompt` unchanged, attaches PDF/image `files`, maps `data.model` through an allowlist, turns on web search when `webSearchEnabled` is set and the model supports it |
| `stream: true` (added by the client when Froala passes `onChunk`) | Newline-delimited JSON: `{"delta": "…"}` lines, then `{"done": true, "session_id", "webSearchUsed"}` |

AI Chat continuity: Froala already puts earlier chat answers into `prompt`, so this server stays stateless. It returns a `session_id` (the one it received, or a new UUID), which Froala sends back on the next question. Store conversations under that ID if you need server-side history or audit logs.

## Code

<!-- validate:skip -->
```js
// server.mjs — Express backend for Froala AI Assist (Node 18+, "type": "module")
// npm install express express-rate-limit @anthropic-ai/sdk openai
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI, { toFile } from 'openai';
import { randomUUID } from 'node:crypto';

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null; // only used for speech-to-text

// The browser sends an alias (aiChatModels[].modelName); only the server knows provider model IDs.
// Check each provider's current model list before deploying; these are examples.
const MODELS = {
  best: process.env.AI_MODEL_BEST || 'claude-opus-5-5',
  fast: process.env.AI_MODEL_FAST || 'claude-haiku-5-5',
};
const WEB_SEARCH_MODELS = new Set(['best']); // the web search tool is not available on every model
const TRANSCRIBE_MODEL = process.env.AI_TRANSCRIBE_MODEL; // set to a current speech-to-text model from OpenAI's model list
const BINARY_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const app = express();
app.use(express.json({ limit: '25mb' })); // keep in line with aiChatMaxFileSizeMB × aiChatMaxFiles (base64 adds ~33%)

// Replace with your real session/JWT check. Every AI call spends your money.
function requireUser(req, res, next) {
  req.userId = req.get('x-demo-user') || null; // e.g. from your session cookie
  if (!req.userId) return res.status(401).json({ error: 'Sign in to use AI features' });
  next();
}

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60, // inline suggestions send a request on every typing pause
  keyGenerator: (req) => req.userId,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

app.post('/api/ai', requireUser, aiLimiter, async (req, res) => {
  const data = req.body || {};
  const abort = new AbortController();
  res.on('close', () => { if (!res.writableEnded) abort.abort(); }); // the user pressed Stop or left

  try {
    // 1. Speech-to-text: { speechToText: true, audio: <base64>, audioType, lang }
    if (data.speechToText) {
      if (!openai || !TRANSCRIBE_MODEL) return res.status(501).json({ error: 'Speech-to-text is not configured' });
      const file = await toFile(Buffer.from(String(data.audio || ''), 'base64'), 'speech.wav', { type: data.audioType || 'audio/wav' });
      const result = await openai.audio.transcriptions.create(
        { file, model: TRANSCRIBE_MODEL, language: String(data.lang || '').split('-')[0] || undefined },
        { signal: abort.signal },
      );
      return res.json({ answer: result.text });
    }

    // 2. Text features. Froala has already built the full prompt (instructions + selection/document context,
    //    text files and earlier chat answers), so send data.prompt as it is.
    if (typeof data.prompt !== 'string' || !data.prompt.trim()) return res.status(400).json({ error: 'prompt is required' });
    const alias = data.autoComplete ? 'fast' : (MODELS[data.model] ? data.model : 'best');
    const content = [];
    for (const f of Array.isArray(data.files) ? data.files : []) {
      if (!f || !f.base64 || !BINARY_TYPES.has(f.mimeType)) continue; // text files are already inside the prompt
      const source = { type: 'base64', media_type: f.mimeType, data: f.base64 };
      content.push(f.mimeType === 'application/pdf' ? { type: 'document', source } : { type: 'image', source });
    }
    content.push({ type: 'text', text: data.prompt });

    const params = {
      model: MODELS[alias],
      max_tokens: data.autoComplete ? 64 : 16000,
      messages: [{ role: 'user', content }],
    };
    if (data.autoComplete) {
      params.thinking = { type: 'disabled' }; // ghost text must be fast and short
      params.output_config = { effort: 'low' };
    } else {
      params.output_config = { effort: data.reasoningEnabled ? 'high' : 'low' };
    }
    if (data.webSearchEnabled && WEB_SEARCH_MODELS.has(alias)) {
      params.tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }];
    }

    // Froala keeps whatever session_id you return and sends it back on the next chat question.
    const sessionId = data.session_id && data.session_id !== 'new_session' ? String(data.session_id) : randomUUID();
    const usedWebSearch = (msg) => msg.content.some((b) => b.type === 'server_tool_use' || b.type === 'web_search_tool_result');

    if (!data.stream) {
      const msg = await anthropic.messages.create(params, { signal: abort.signal });
      if (msg.stop_reason === 'refusal') return res.status(422).json({ error: 'The AI declined this request' });
      const answer = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      return res.json({ answer, session_id: sessionId, webSearchUsed: usedWebSearch(msg) });
    }

    // Streaming: newline-delimited JSON. {"delta": "..."} per piece, then one {"done": true, ...} line.
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const stream = anthropic.messages.stream(params, { signal: abort.signal });
    stream.on('text', (delta) => res.write(JSON.stringify({ delta }) + '\n'));
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') res.write(JSON.stringify({ error: 'The AI declined this request' }) + '\n');
    res.end(JSON.stringify({ done: true, session_id: sessionId, webSearchUsed: usedWebSearch(msg) }) + '\n');
  } catch (err) {
    if (abort.signal.aborted) return; // client went away
    console.error('[ai]', err);
    const status = err instanceof Anthropic.RateLimitError ? 429 : 502;
    if (!res.headersSent) res.status(status).json({ error: 'AI request failed' });
    else res.end(JSON.stringify({ error: 'AI request failed' }) + '\n');
  }
});

app.listen(process.env.PORT || 3000);
```
<!-- validate:end -->

## Adapting it

- **Authentication.** Replace the requireUser function with your session or JWT check. Keep the editor page and `/api/ai` on the same origin so the session cookie is sent (`credentials: 'same-origin'` in the client); for another origin, configure CORS with credentials.
- **Rate limits.** The limiter keys on the user, not the IP. Inline suggestions alone can send several requests a minute per active writer; set the limit from real usage, and add a daily budget per user or tenant if AI is metered.
- **Another provider.** Only the two `anthropic.messages…` calls and the file mapping are provider-specific. Keep the request handling, the model allowlist and the NDJSON stream format, and the client in SKILL.md works unchanged. For OpenAI, the Responses API streams text in events of type "response.output_text.delta" (text in `event.delta`); Froala's [quick start](https://froala.com/wysiwyg-editor/docs/plugins/ai-assist-plugin/quick-start/) has Groq, Gemini and Anthropic handlers written with `fetch`.
- **No speech-to-text provider.** Delete step 1 and set `aiSpeechToText: false` in the editor, so the microphone button is not shown.
- **Errors and refusals.** The server sends a refusal (`stop_reason: 'refusal'`) or a provider failure as an error line, and the client throws. AI Chat then shows its generic "Couldn't generate a response" message with a Retry button; Froala does not display your error text.
- **Prompt injection.** Documents, pasted text, files and web results all reach the model. Don't give this endpoint tools that act on your systems; treat the answer as untrusted HTML and sanitize it before you store or render it outside the editor.
