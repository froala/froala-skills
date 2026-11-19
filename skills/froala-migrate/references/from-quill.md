# Quill → Froala

Identifiers checked against `quill` 2.0.3. Froala names checked against `froala-editor` 5.6.0.
Official Froala guide: https://froala.com/wysiwyg-editor/docs/migration-guides/

<!-- validate:skip -->
## First: what does the app store?

- **Delta JSON** (`quill.getContents()`) → convert to HTML before loading into Froala. Use Quill itself in the migration script: load the Delta (`quill.setContents(delta)`) and read `quill.getSemanticHTML()` (Quill 2).
- **HTML** (`quill.root.innerHTML` or `getSemanticHTML()`) → loads with `html.set()`, but see the class list below.
<!-- validate:end -->

## Formats and toolbar

| Quill format / toolbar item | Froala | Notes |
|---|---|---|
| `bold`, `italic`, `underline`, `strike` | `bold`, `italic`, `underline`, `strikeThrough` | |
| `script` (sub/super) | `subscript`, `superscript` | |
| `header` | `paragraphFormat` | |
| `list` (ordered, bullet) | `formatOL`, `formatUL` | |
| `indent` | `indent`, `outdent` | |
| `align` | `align` | |
| `color`, `background` | `textColor`, `backgroundColor` | |
| `font`, `size` | `fontFamily`, `fontSize` | Quill uses classes; Froala uses inline styles by default |
| `link`, `image`, `video` | `insertLink`, `insertImage`, `insertVideo` | |
| `blockquote`, `code-block` | `quote`, `codeSnippet` | |
| `clean` | `clearFormatting` | |
| `modules.history` | `undo`, `redo` | |
| `modules.syntax` | `codeSnippet` | Froala 5.0+ |

## Classes to convert or style

Quill's HTML uses classes such as `ql-align-center`, `ql-indent-1`, `ql-size-large`, `ql-font-serif` and `ql-direction-rtl`. Either convert them to inline styles in the migration script (recommended, so content is editor-independent), or keep the Quill CSS for those classes on display pages.

Quill images are often stored as base64 data URIs inside the content. Plan whether to upload them to storage during the migration.
