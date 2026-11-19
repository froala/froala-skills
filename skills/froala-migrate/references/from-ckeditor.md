# CKEditor → Froala

Identifiers checked against `ckeditor5` and `ckeditor5-premium-features` 49.1.0 (CKEditor 4: `ckeditor4`
4.25.2). Froala names checked against `froala-editor` 5.6.0 (CI re-checks the Froala column).
Official Froala guides: https://froala.com/wysiwyg-editor/docs/migration-guides/ckeditor/ and the
CKEditor 5 guide in the same section.

## CKEditor 5 toolbar items

| CKEditor 5 item | Froala | Notes |
|---|---|---|
| `heading` | `paragraphFormat` | Map `heading.options` to the `paragraphFormat` option |
| `bold`, `italic`, `underline`, `strikethrough` | `bold`, `italic`, `underline`, `strikeThrough` | |
| `subscript`, `superscript`, `code` | `subscript`, `superscript`, `inlineStyle` | Inline code: define a style in `inlineStyles`, or a custom command |
| `fontFamily`, `fontSize` | `fontFamily`, `fontSize` | Copy the option lists |
| `fontColor`, `fontBackgroundColor`, `highlight` | `textColor`, `backgroundColor` | Highlight markers become background colours |
| `alignment` | `align` | Or `alignLeft`, `alignCenter`, `alignRight`, `alignJustify` |
| `bulletedList`, `numberedList` | `formatUL`, `formatOL` | |
| `outdent`, `indent` | `outdent`, `indent` | |
| `link` | `insertLink` | Link decorators → `linkAttributes` / `linkStyles` |
| `insertImage`, `uploadImage` | `insertImage` | |
| `insertTable` | `insertTable` | |
| `mediaEmbed` | `insertVideo` | See "Content" — CKEditor can store `oembed` elements |
| `blockQuote`, `codeBlock`, `horizontalLine` | `quote`, `codeSnippet`, `insertHR` | `codeSnippet` needs Froala 5.0+ |
| `pageBreak`, `specialCharacters`, `emoji` | `pageBreak`, `specialCharacters`, `emoticons` | |
| `findAndReplace`, `sourceEditing`, `removeFormat` | `findReplaceButton`, `html`, `clearFormatting` | |
| `undo`, `redo`, `selectAll`, `fullscreen` | `undo`, `redo`, `selectAll`, `fullscreen` | |
| `bookmark` | `insertAnchor` | Anchors inside the document |

## CKEditor 5 premium features (only if the project uses them)

| CKEditor 5 item | Froala | Notes |
|---|---|---|
| `trackChanges` | `track_changes` — `trackChanges`, `showChanges`, `applyAll`, `removeAll` | Load `track_changes.min.js` separately; or collaborative suggestion mode |
| `comment`, `commentsArchive` | `collaborative` — `collabAddComment`, `collabPanel` | Froala 5.3+, needs a backend |
| `revisionHistory` | `collaborative` — `versionControl` | Froala 5.3+ |
| `importWord` | `importFromWord` — `import_from_word` | Froala converts in the browser (mammoth.js) |
| `exportWord`, `exportPdf` | `exportToWord` — `export_to_word`; `print` — `getPDF` | Browser-side in Froala. PDF needs html2pdf.js loaded before Froala (or the `html2pdf` option); verify the downloaded PDF |
| `aiAssistant`, `toggleAi`, `aiQuickActions` | `aiAssist` — `aiAssist`, `aiShortCuts`, `aiChatAssistant` | Bring your own AI provider through `aiAssistRequest` |
| `formatPainter` | `paintFormat` — `paintFormat` | Froala 5.6.0+. Copies inline formatting only |

## Options and API

| CKEditor 5 | Froala | Notes |
|---|---|---|
| `ClassicEditor.create(element, config)` | `new FroalaEditor(selector, options)` | Inline/balloon editors → `toolbarInline` |
| `licenseKey` | `key` | |
| `placeholder` | `placeholderText` | |
| `language` | `language` | Load the Froala language file |
| `simpleUpload.uploadUrl` | `imageUploadURL` | Response key differs, see below |
| custom `UploadAdapter` | `image.beforeUpload` event + `image.insert()` | |
| `htmlSupport` (General HTML Support) | `htmlAllowedTags`, `htmlAllowedAttrs` | Still sanitize on the server |
| `editor.getData()` / `setData()` | `html.get()` / `html.set()` | |
| `editor.model.document.on('change:data')` | `contentChanged` event | |
| `editor.enableReadOnlyMode()` | `edit.off()` | |

<!-- validate:skip -->
**Upload responses differ.** The CKEditor simple upload adapter reads `{ "url": "…" }` (or `urls.default`); Froala reads `{ "link": "…" }`. During the migration the endpoint can return `{ "url": url, "link": url }`.
<!-- validate:end -->

## Content

<!-- validate:skip -->
CKEditor 5 stores HTML from `getData()`. Watch for:

- **Media embeds stored as `<oembed url="…">`** inside `<figure class="media">` (`mediaEmbed.elementName` defaults to `oembed`; previews are only stored when `mediaEmbed.previewsInData` is on). Browsers and Froala do not render `oembed`; convert these to `<iframe>` embeds (YouTube, Vimeo…) or links in the migration script.
- `<figure class="image">` / `<figure class="table">` wrappers and `image-style-*` classes: they load, but restyle or convert them so they look right with `froala_style.min.css`.
- Display pages use the `ck-content` class: switch them to `fr-view` and `froala_style.min.css`.

## CKEditor 4

CKEditor 4 (`CKEDITOR.replace`, `config.toolbar`, `extraPlugins`) also stores HTML, so content usually loads directly. Map toolbar items by name the same way (`Bold` → `bold`, `NumberedList` → `formatOL`, `BulletedList` → `formatUL`, `Link` → `insertLink`, `Image` → `insertImage`, `Table` → `insertTable`, `Source` → `html`). Check custom `extraPlugins` one by one — each needs a Froala equivalent or a custom plugin.

<!-- validate:end -->