---
name: froala-ai-assist
description: >
  Use when the user is adding AI writing features to Froala. Activates on:
  config tokens (aiSupplementalTermsAccepted, aiAssistRequest, aiAssistEndpoint, aiAssistHeaders,
  aiChatModels, aiChatDefaultModel, aiChatStreamResponse, inlineSuggestions, aiSpeechToText),
  button tokens (aiAssist, aiShortCuts, aiChatAssistant, aiImproveWriting),
  plugin tokens (ai_assist.min.js, AI Assist, AI Chat),
  provider tokens (OpenAI, Gemini, Anthropic, Groq with Froala),
  or when user asks how to add AI writing, AI chat, tone change, translate, improve writing,
  AI image generation, or ghost-text autocomplete to the Froala editor.
version: 1.0.0
license: MIT
---

# Froala AI Assist

**Version gates:** AI Assist requires **5.1.0+**. AI Chat (`aiChatAssistant`), Improve Writing, Speech-to-Text and inline suggestions require **5.4.0+**. AI image generation requires **5.5.0+**. Options below are verified against 5.6.0.

AI Assist adds free-form prompts, change tone, translate, improve writing (returned as accept/reject changes), an AI Chat panel, dictation, inline ghost-text suggestions and AI image generation.

**Froala does not ship a model.** You connect your own provider — OpenAI, Google Gemini, Anthropic, Groq, or your own backend.

Plugin name `aiAssist`; files `js/plugins/ai_assist.min.js` and `css/plugins/ai_assist.min.css`. Both are already in the `pkgd` bundles.

**Not available with `toolbarInline: true`** — the plugin does nothing and the AI buttons are hidden in inline-toolbar mode.

---

## Required: Accept the Terms

```js
aiSupplementalTermsAccepted: true,
```

Without it (default `false`), every AI button opens a popup asking you to accept the AI Supplemental Terms and nothing else happens. This is the single most common reason AI Assist "doesn't work".

---

## Recommended: Call Your Own Backend

Keep provider API keys on your server. `aiAssistRequest(data, signal, onChunk)` receives the request data, an `AbortSignal`, and — only when Froala wants a streamed answer (AI Chat with `aiChatStreamResponse: true`, the default) — an `onChunk` function. Call `onChunk(text)` for each piece, then still return the full answer. Return the answer as an HTML string, or `{ answer, session_id?, webSearchUsed? }`.

```js
new FroalaEditor('#editor', {
  aiSupplementalTermsAccepted: true,
  toolbarButtons: ['bold', 'italic', '|', 'aiAssist', 'aiShortCuts', 'aiChatAssistant'],

  aiAssistRequest: async function (data, signal, onChunk) {
    const res = await fetch('/api/ai', {       // your server calls OpenAI / Gemini / Anthropic
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: data.prompt, context: data.context, model: data.model }),
      signal,
    });
    const json = await res.json();
    return json.answer;                        // HTML string
  },

  // Optional: model picker in the AI Chat panel (modelName is required;
  // webSearch: false / reasoning: false disable those toggles for that model)
  aiChatModels: [
    { modelName: 'gpt-5', displayName: 'GPT-5' },
    { modelName: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
    { modelName: 'claude-sonnet-4-5', displayName: 'Claude Sonnet', webSearch: false },
  ],
  aiChatDefaultModel: 'gpt-5',
});
```

`data` may include `prompt`, `context`, `question`, `session_id`, `question_order_number`, `model`, `webSearchEnabled`, `reasoningEnabled`, `files`, `referenceUrls`, `regenerate` and `autoComplete`, depending on which feature the user invoked. The selected `aiChatModels` entry's `modelName` arrives as `data.model`. Attached `files` arrive pre-encoded as `{ name, mimeType, base64 }` (PDF, images) or `{ name, mimeType, textContent }` (TXT, MD, DOCX — DOCX needs Mammoth.js on the page).

The same function serves every AI feature, so your backend must also handle:
- **Inline suggestions** (`inlineSuggestions`, **on by default**): a request with `autoComplete: true` after each typing pause. Set `inlineSuggestions: false` if you don't want this traffic.
- **Speech-to-Text** (`aiSpeechToText`, **on by default**): a request `{ speechToText: true, audio, audioType, lang }` with recorded audio; return the transcript text. Set `aiSpeechToText: false` if your backend can't transcribe.

### Endpoint alternative

Instead of `aiAssistRequest`, set `aiAssistEndpoint` to a URL (Froala POSTs JSON to it), with `aiAssistHeaders` for auth, `aiAssistDataKeys` to rename request fields, `aiAssistAdditionalData` for extra fields, and `aiAssistResponseParserPath` (dot/array path) to locate the answer in the JSON response. If `aiAssistRequest` is a function, it takes precedence.

---

## Prototype Only: Calling the Provider from the Browser

Froala's official example calls OpenAI directly from the browser. **This exposes your API key to every visitor.** Use it for local prototyping only, never in production — route through your own backend instead.

https://froala.com/wysiwyg-editor/examples/ai-assist-direct-openai-api-integration/

---

## Toolbar Buttons

| Button | Purpose |
|---|---|
| `aiAssist` | Free-form prompt popup (also Ctrl/Cmd+Shift+I) |
| `aiShortCuts` | Change-tone and translate dropdown |
| `aiChatAssistant` | AI Chat side panel |
| `aiImproveWriting` | Improve Writing on the selection; result comes back as accept/reject changes |

All come from the `aiAssist` plugin. Improve Writing also appears as a floating button on text selection, controlled by `selectionActionButtons` (default `['aiImproveWriting', 'collabAddComment']`).

---

## Other Options

| Option | Purpose |
|---|---|
| `aiAssistToneOptions` / `aiAssistTranslateOptions` | Choices in the tone and translate menus |
| `aiAssistPromptTemplate` / `aiImproveWritingPrompt` | Prompt templates |
| `aiChatWebSearchEnabled` / `aiChatReasoningEnabled` | Initial AI Chat toggles |
| `aiChatStreamResponse` | Stream AI Chat responses |
| `aiChatSupportedFileTypes` / `aiChatMaxFileSizeMB` / `aiChatMaxFiles` | Files AI Chat accepts as context (defaults: pdf, docx, txt, md, images; 20 MB; 10 files) |
| `aiChatRequestTimeoutMs` | AI Chat request timeout (default 60000) |
| `aiSpeechToText` | Microphone/dictation button in the AI prompt (default `true`) |
| `inlineSuggestions` / `inlineSuggestionsDelay` | Ghost-text autocomplete while typing (default `true`, 120 ms); Tab accepts, Esc dismisses |

Events include `aiAssist.beforeInsert`, `aiAssist.afterInsert`, `aiAssist.chatBeforeApply` (return `false` to cancel) and `aiAssist.chatAfterApply`. Methods include `aiAssist.showPromptPopup()`, `aiChatAssistant.togglePanel()` and `aiChatAssistant.sendMessage(text)`.

**Image generation (5.5.0+):** users describe an image in the AI Assist prompt; your backend returns the image(s) as the answer, and users can preview, insert, or "Try again" (sent with `regenerate: true`).

---

## Common Mistakes

| Problem | Cause | Fix |
|---|---|---|
| AI buttons only show a terms popup | `aiSupplementalTermsAccepted` not set | Set it to `true` |
| AI buttons missing entirely | Core build without `ai_assist.min.js`, or `toolbarInline: true` | Use a `pkgd` bundle or load the plugin JS and CSS; use a regular toolbar |
| Unexpected requests while typing / audio payloads | `inlineSuggestions` and `aiSpeechToText` default to `true` | Handle `autoComplete` / `speechToText` requests, or set the options to `false` |
| API key visible in the browser | Calling the provider directly from the client | Move the call behind your own endpoint via `aiAssistRequest` |
| Response inserted as plain text | Returned Markdown instead of HTML | Return an HTML string from `aiAssistRequest` |
| Request never cancels | Ignored the `signal` argument | Pass `signal` through to `fetch` |

---

## Reference

- AI Assist plugin: https://froala.com/wysiwyg-editor/docs/plugins/ai-assist-plugin/
- Quick start (backend + streaming): https://froala.com/wysiwyg-editor/docs/plugins/ai-assist-plugin/quick-start/
- OpenAI example: https://froala.com/wysiwyg-editor/examples/ai-assist-direct-openai-api-integration/
