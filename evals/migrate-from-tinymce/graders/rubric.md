---
type: llm
---

PASS if the answer produces a `new FroalaEditor('#body', {...})` config with `toolbarButtons` using real Froala button names (for example `undo`, `redo`, `bold`, `italic`, `formatUL`, `formatOL`, `insertLink`, `insertImage`, `insertTable`, `html`), `imageUploadURL: '/upload'`, `height: 400`, notes the server must return `{ "link": ... }`, and replaces `getContent()` with `editor.html.get()` (after init).
FAIL if it invents button or option names, or keeps TinyMCE APIs.
