---
name: froala-ai-assist
description: >
  Use when adding or fixing AI writing features in the Froala editor: free-form prompts, change tone,
  translate, improve writing, AI Chat, speech-to-text prompts or ghost-text autocomplete, and when connecting Froala to OpenAI, Gemini, Anthropic, Groq or a custom backend.
  Activates on aiSupplementalTermsAccepted, aiAssistRequest, aiAssistEndpoint, aiAssistHeaders,
  aiChatModels, aiChatDefaultModel, aiChatStreamResponse, inlineSuggestions, aiSpeechToText, aiAssist,
  aiShortCuts, aiChatAssistant or ai_assist.min.js. NOT for general editor setup (froala-initialization-and-sdks).
license: MIT
metadata:
  version: "1.1.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-18"
---

# Froala AI Assist

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. A project that still calls `.froalaEditor()` on a jQuery object runs Froala 2: upgrading means switching to `new FroalaEditor(...)`. Names that start with `$` in the current API (`editor.$el`, the `$btn` passed to `refresh`, the `$popup` from `editor.popups.create`) are Froala's own DOM helpers, not jQuery: keep using them where the API hands them to you.

**Check the version first** (`node_modules/froala-editor/package.json`):

| Feature | Needs |
|---|---|
| AI Assist (prompt, tone, translate) | 5.1.0+ |
| AI Chat (`aiChatAssistant`), Improve Writing with accept/reject, speech-to-text, inline suggestions | 5.4.0+ |

Option names below were checked against the package version in `metadata.verified_against`. For newer versions, confirm option names in the package or the [AI Assist docs](https://froala.com/wysiwyg-editor/docs/plugins/ai-assist-plugin/). Example: the 5.4.0 release notes name the autocomplete options `aiAssistAutoComplete…`, but the 5.4.0 and 5.5.0 packages use `inlineSuggestions…`.

Froala 5.5.0 also added AI image generation. This skill does not cover it yet: its request/response contract is not described here. Use the AI Assist docs for it.

**Froala does not ship a model.** You connect your own provider — OpenAI, Google Gemini, Anthropic, Groq, or your own backend.

Plugin files: `js/plugins/ai_assist.min.js` and `css/plugins/ai_assist.min.css` (both in the `pkgd` bundles). Plugin name for `pluginsEnabled`: `aiAssist`.

---

## Required: Accept the Terms

```js
aiSupplementalTermsAccepted: true,
```

Without it, every AI button opens a popup asking to accept the AI Supplemental Terms and nothing else happens. This is the most common reason AI Assist "doesn't work". The integrator accepts these terms on behalf of their organization — tell the user what the option means before setting it.

---

## Recommended: Call Your Own Backend

Keep provider API keys on your server. `aiAssistRequest(data, signal, onChunk)` receives:

- `data` — the request. **Forward all of it** to your backend; which fields are present depends on the feature used.
- `signal` — an `AbortSignal`. Pass it to `fetch` so the Stop button works.
- `onChunk` — present when streaming. Call it with each piece of answer text as it arrives.

**Response contract.** Resolve with either:

- an HTML string — treated as `{ answer }`; **no** `session_id` or `webSearchUsed` is kept, or
- an object `{ answer, session_id, webSearchUsed }`. AI Chat stores `session_id` and sends it back as `data.session_id` on the next question; `webSearchUsed: true` marks the answer as web-assisted.

A stateful backend must therefore return an object, also when streaming.

```js
new FroalaEditor('#editor', {
  aiSupplementalTermsAccepted: true,
  toolbarButtons: ['bold', 'italic', '|', 'aiAssist', 'aiShortCuts', 'aiChatAssistant'],

  aiAssistRequest: async function (data, signal, onChunk) {
    const stream = typeof onChunk === 'function';
    const res = await fetch('/api/ai', {          // your server calls OpenAI / Gemini / Anthropic …
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, stream }),  // forward everything: chat follow-ups need session_id, question, files…
      signal,
    });
    if (!res.ok) throw new Error(`AI request failed: ${res.status}`);

    if (stream && res.body) {                     // server streams plain text/HTML pieces
      // Conversation metadata travels in response headers (names chosen by your backend;
      // cross-origin requests also need Access-Control-Expose-Headers).
      const sessionId = res.headers.get('X-AI-Session-Id') || undefined;
      const webSearchUsed = res.headers.get('X-AI-Web-Search-Used') === 'true';

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        full += piece;
        onChunk(piece);
      }
      return { answer: full, session_id: sessionId, webSearchUsed };
    }

    const json = await res.json();               // server returns { answer, session_id? }
    return json;
  },

  // Optional: model picker in the AI Chat panel. Use model IDs your backend accepts.
  aiChatModels: [
    { modelName: 'fast-model-id', displayName: 'Fast' },
    { modelName: 'strong-model-id', displayName: 'Best quality' },
  ],
  aiChatDefaultModel: 'fast-model-id',
});
```

**What `data` can contain** (depends on the feature): `prompt`, `context`, `question`, `session_id`, `question_order_number`, `model`, `webSearchEnabled`, `reasoningEnabled`, `files`, `referenceUrls`, `regenerate`, and `autoComplete` (true for inline-suggestion requests). The chosen `aiChatModels` entry's `modelName` arrives as `data.model`.

**Backend checklist:**

- Authenticate the user and rate-limit the endpoint — it spends your AI budget.
- Route `autoComplete: true` requests to a cheap, fast model, or turn inline suggestions off (see below).
- Validate `files` (type, size) and fetch `referenceUrls` server-side with SSRF protection.
- Return HTML. Markdown is not converted.
- Test continuity: ask two questions in AI Chat and check that the second request carries the `session_id` returned by the first.
- Sanitize the returned HTML on the server before saving documents that contain it.

### Endpoint alternative

Instead of `aiAssistRequest`, set `aiAssistEndpoint` to a URL, with `aiAssistHeaders` for auth and `aiAssistResponseParserPath` to locate the answer in the response.

---

## Inline Suggestions Are On by Default

`inlineSuggestions` defaults to **`true`**. As soon as AI is configured, a pause while typing sends the current text to your backend (`data.autoComplete === true`) and shows grey ghost text (Tab accepts, Esc dismisses).

```js
inlineSuggestions: false,       // turn it off
inlineSuggestionsDelay: 120,    // ms pause before a request (default 120)
inlineSuggestionsPromptTemplate: '…', // customise the prompt
```

Decide deliberately: this can create many requests (cost) and sends partial drafts to your AI provider (privacy).

---

## Prototype Only: Calling the Provider from the Browser

Froala's official example calls OpenAI directly from the browser. **This exposes your API key to every visitor.** Use it for local prototyping only — route through your own backend in production.

https://froala.com/wysiwyg-editor/examples/ai-assist-direct-openai-api-integration/

---

## Toolbar Buttons

| Button | Purpose |
|---|---|
| `aiAssist` | Free-form prompt panel |
| `aiShortCuts` | Tone, translate, improve writing shortcuts |
| `aiChatAssistant` | AI Chat panel (5.4.0+) |

All three come from the `aiAssist` plugin.

---

## Other Options

| Option | Default | Purpose |
|---|---|---|
| `aiAssistToneOptions` / `aiAssistTranslateOptions` | built-in lists | `{ title, prompt }` items in the tone and translate menus; an empty list hides the menu |
| `aiAssistPromptTemplate` / `aiImproveWritingPrompt` | built-in | Prompt templates |
| `aiChatStreamResponse` | `true` | Stream AI Chat answers through `onChunk` |
| `aiChatWebSearchEnabled` / `aiChatReasoningEnabled` | `false` | Initial AI Chat toggles |
| `aiChatSupportedFileTypes` | pdf, docx, txt, md, jpg, jpeg, png, gif, webp | Files AI Chat accepts as context |
| `aiChatMaxFileSizeMB` / `aiChatMaxFiles` | `20` / `10` | Upload limits for AI Chat |
| `aiChatRequestTimeoutMs` | `60000` | Request timeout |
| `aiSpeechToText` | `true` | Microphone button for dictating prompts |
| `inlineSuggestions` | `true` | Ghost-text autocomplete (see above) |

---

## Common Mistakes

| Problem | Cause | Fix |
|---|---|---|
| AI buttons only show a terms popup | `aiSupplementalTermsAccepted` not set | Set it to `true` |
| AI buttons missing entirely | Core build without `ai_assist.min.js`, or `pluginsEnabled` without `aiAssist` | Use a `pkgd` bundle, or load the plugin JS and CSS |
| AI Chat forgets the conversation / ignores files | Backend receives only `prompt`, or the response is a plain string without `session_id` | Forward the whole `data` object and return `{ answer, session_id }` |
| Unexpected AI bills or traffic | Inline suggestions on by default | Set `inlineSuggestions: false` or route `autoComplete` requests to a cheap model |
| API key visible in the browser | Calling the provider directly from the client | Move the call behind your own endpoint via `aiAssistRequest` |
| Markdown symbols appear in the text | Returned Markdown instead of HTML | Return an HTML string |
| Stop button does not cancel | Ignored the `signal` argument | Pass `signal` through to `fetch` |

---

## Reference

- AI Assist plugin: https://froala.com/wysiwyg-editor/docs/plugins/ai-assist-plugin/
- OpenAI example: https://froala.com/wysiwyg-editor/examples/ai-assist-direct-openai-api-integration/
