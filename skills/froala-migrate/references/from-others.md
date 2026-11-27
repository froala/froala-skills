# Other editors → Froala

Official Froala guides: Summernote (https://froala.com/wysiwyg-editor/docs/migration-guides/summernote-to-froala/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate),
Lexical (https://froala.com/wysiwyg-editor/docs/migration-guides/migrate-lexical-to-froala/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate), Trix
(https://froala.com/wysiwyg-editor/docs/migration-guides/trix/initialization/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate), ContentTools and Aloha
(index: https://froala.com/wysiwyg-editor/docs/migration-guides/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate).

Froala names checked against `froala-editor` 5.6.0. For each editor, the main work is usually the
**content format**, not the toolbar.

| Editor | Content format | How to get HTML | Their toolbar / upload config | Froala |
|---|---|---|---|---|
| Summernote | HTML; images are data URIs unless the app set an upload callback | Already HTML (`$('#el').summernote('code')`) | jQuery plugin; `toolbar` groups; upload and change callbacks | `toolbarButtons`, `imageUploadURL`, `contentChanged` |
| Jodit | HTML | Already HTML | `buttons` list | `toolbarButtons` |
| Trix (standalone) | HTML with `figure data-trix-attachment` | Already HTML; convert attachment figures to plain `img` / links | Attachments uploaded by the app | `imageUploadURL` |
| Rails Action Text | HTML with `<action-text-attachment sgid="…">` | Do **not** flatten. Inventory blob attachments and record attachments first | Attachments resolve app records through signed GlobalIDs | `html.set()` only after an explicit decision per attachment type |
| Toast UI Editor | Markdown (or HTML) | Markdown can stay Markdown | `toolbarItems` | `markdown.setMarkdown()` with Markdown mode on (Froala 5.4+) |
| Lexical | Lexical JSON | `$generateHtmlFromNodes` from `@lexical/html`, inside a (headless) Lexical editor with the app's nodes; recipe in `content-conversion.md` | Custom nodes need custom handling | `html.set()` |
| Slate | Slate JSON (app-specific) | The app's own serializer — Slate has no standard HTML format | Read the project's render code | `html.set()` |
| Draft.js / react-draft-wysiwyg | Draft.js raw JSON | No built-in exporter: `convertFromRaw` + `stateToHTML` (community `draft-js-export-html`), or `draftjs-to-html`; recipe in `content-conversion.md` | Check custom entities (mentions, embeds) | `html.set()` |
| Editor.js | Blocks JSON | `editorjs-html`, or a small custom renderer per block type | Block types without HTML meaning need decisions | `html.set()` |
| RichTextEditor (richtexteditor.com) | HTML | `getHTMLCode()`; a named `<textarea>` may post the value with a form | Its config and `all_plugins.js` | `toolbarButtons` |
| Redactor | HTML | `app.editor.getContent()`; Redactor 3: `$R('#content', 'source.getCode')` | `plugins` array; uploads in `image.upload` | `toolbarButtons`, `imageUploadURL` |
| Kendo UI for jQuery Editor | HTML; submitted encoded by default | `value()` returns HTML, `encodedValue()` returns encoded HTML | `tools` list | `toolbarButtons` |
| SunEditor | HTML | v3: `editor.$.html.get()`; v2: `editor.getContents()` | `buttonList` | `toolbarButtons` |
| pell | HTML | The string passed to `onChange` | `actions` (built-in or app-defined) | `toolbarButtons`, `contentChanged` |

### Lexical and Summernote APIs

| Existing API | Froala | Notes |
|---|---|---|
| Lexical `editor.registerUpdateListener(cb)` | `contentChanged` event | |
| Lexical `editor.setEditable(false)` | `edit.off()` | |
| Lexical `editor.setRootElement(null)` | `destroy()` | |
| Lexical React plugins (`ToolbarPlugin`, `HistoryPlugin`, …) | `toolbarButtons`, `undo` / `redo` | Or keep the app's toolbar with `headless: true` (Froala 5.5.0+) |
| Summernote `$('#el').summernote('code')` / `('code', html)` | `html.get()` / `html.set()` | |
| Summernote `callbacks.onChange` | `contentChanged` event | |
| Summernote `callbacks.onImageUpload` | `imageUploadURL`, or `image.beforeUpload` + `image.insert()` | |
| Summernote `$('#el').summernote('disable')` / `('destroy')` | `edit.off()` / `destroy()` | |

### Checks specific to these editors

<!-- validate:skip -->
- **Rails Action Text:** `<action-text-attachment>` is not in Froala's default `htmlAllowedTags`, so Froala does not keep it on load. A converted document can look identical in a screenshot while the app has lost the link to its records. Inspect the persisted markup, list blob attachments and record attachments (mentions, embedded models), and agree with the user how each type is represented in Froala before converting anything. Test save **and** reload with both kinds.
- **RichTextEditor:** if the editor sits on a named `<textarea>` inside a form, keep the same field name so the server still receives the content. Test save, reload and form submit with a real document.
- **Kendo UI for jQuery Editor:** find out whether the server receives HTML (`value()`, or `encoded: false`) or encoded HTML (the default form submit, `encodedValue()`), and keep that contract. Use a fixture with literal `<`, `>` and `&` in the text to catch double decoding.
- **pell:** map the `onChange` save callback to Froala's `contentChanged` event, and rebuild every app-defined action; compare the markup each produces.
<!-- validate:end -->

For every editor:

1. Convert on **copies** with a script the team can re-run.
2. Load samples with `html.set()` and read them back with `html.get()`; compare.
3. Uploads: point Froala's `imageUploadURL` at the existing endpoint and add a `link` key to its JSON response.
4. Display pages: use `froala_style.min.css` and the `fr-view` class.
