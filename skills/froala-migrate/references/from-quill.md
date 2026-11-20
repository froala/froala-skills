# Quill → Froala

Identifiers checked against `quill` 2.0.3 (and the wrappers `react-quill-new` 3.8.3, `ngx-quill` 30.1.3).
Froala names checked against `froala-editor` 5.6.0.
Official Froala guide: https://froala.com/wysiwyg-editor/docs/migration-guides/quill-to-froala/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate

<!-- validate:skip -->
## First: what does the app store?

- **Delta JSON** (`quill.getContents()`, `ngx-quill` `format="object"` or `"json"`) → convert to HTML before loading into Froala: load the Delta into Quill (`quill.setContents(delta)`) and read `quill.getSemanticHTML()`. Run it in a browser and post-process the output (spaces written as `&nbsp;`, videos written as links): `content-conversion.md` has the recipe and the fix list.
- **HTML from `getSemanticHTML()`** (`react-quill-new` default, `ngx-quill` `format="html"`) → loads with `html.set()` after the same post-processing.
- **HTML from `quill.root.innerHTML`** (original `react-quill`, custom code) → Quill's internal markup; with Quill 2 bullet lists are stored as `<ol><li data-list="bullet">`. Re-export through Quill first (see `content-conversion.md`).
<!-- validate:end -->

## Formats and toolbar

| Quill format / toolbar item | Froala | Notes |
|---|---|---|
| `bold`, `italic`, `underline`, `strike` | `bold`, `italic`, `underline`, `strikeThrough` | |
| `script` (sub/super) | `subscript`, `superscript` | |
| `header` | `paragraphFormat` | |
| `list` (ordered, bullet) | `formatOL`, `formatUL` | |
| `list` (checked / unchecked) | No built-in equivalent | Existing checklists load as lists with `data-list` attributes; toggling needs a custom plugin |
| `indent` | `indent`, `outdent` | |
| `align` | `align` | |
| `direction` | `direction` option | No per-paragraph toggle button; build a custom command if users switch direction per paragraph |
| `color`, `background` | `textColor`, `backgroundColor` | |
| `font`, `size` | `fontFamily`, `fontSize` | Quill uses classes; Froala uses inline styles by default |
| `link`, `image`, `video` | `insertLink`, `insertImage`, `insertVideo` | |
| `blockquote`, `code-block` | `quote`, `codeSnippet` | |
| `code` (inline) | `inlineStyle` | Define a monospace entry in `inlineStyles`, or a custom command |
| `formula` (KaTeX) | No built-in plugin | Third-party MathType plugin for Froala (Wiris, `@wiris/mathtype-froala`), or keep formulas as rendered images/MathML. Plan this before converting: Quill exports formulas as plain LaTeX text |
| `clean` | `clearFormatting` | |
| `modules.history` | `undo`, `redo` | |
| `modules.syntax` | `codeSnippet` | Froala 5.0+ |
| `modules.toolbar` handlers (custom buttons) | Custom commands ([Custom button](https://froala.com/wysiwyg-editor/docs/concepts/custom/button/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate)) | |
| Image upload through a custom toolbar `image` handler | `imageUploadURL` | Quill has no built-in upload: see the app's handler and point Froala at the same endpoint |

## API and events

| Quill | Froala | Notes |
|---|---|---|
| `new Quill('#editor', { theme, modules, formats, placeholder, readOnly })` | `new FroalaEditor('#editor', options)` | `placeholder` → `placeholderText`; `formats` allow-list → `htmlAllowedTags` / `pluginsEnabled` |
| `quill.getSemanticHTML()` / `quill.root.innerHTML` | `html.get()` | |
| `quill.clipboard.dangerouslyPasteHTML(html)` | `html.set()` | |
| `quill.getText()` | `editor.el.textContent` | |
| `quill.on('text-change', …)` | `contentChanged` event | |
| `quill.enable(false)` / `quill.enable(true)` | `edit.off()` / `edit.on()` | |
| `quill.focus()` / `quill.blur()` | `events.focus()` / `editor.el.blur()` | Froala has no `events.blur()`; blur the editable element (`editor.el`) directly |

## Classes to convert or style

Quill's HTML uses classes such as `ql-align-center`, `ql-indent-1`, `ql-size-large`, `ql-font-serif` and `ql-direction-rtl`. Either convert them to inline styles in the migration script (recommended, so content is editor-independent), or keep the Quill CSS for those classes on display pages.

Quill images are often stored as base64 data URIs inside the content. Plan whether to upload them to storage during the migration.
