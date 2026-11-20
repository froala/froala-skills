# CKEditor → Froala

Identifiers checked against `ckeditor5` and `ckeditor5-premium-features` 49.1.0 (toolbar names from the
packages' `ckeditor5-metadata.json`) and `ckeditor4` 4.25.2. Froala names checked against
`froala-editor` 5.6.0 (CI re-checks the Froala column).
Official Froala guides: https://froala.com/wysiwyg-editor/docs/migration-guides/ckeditor-5-to-froala/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate and
https://froala.com/wysiwyg-editor/docs/migration-guides/ckeditor/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate

Support and licence facts for CKEditor 4 and 5 (with sources) are in `vendor-status.md`.

**Contents:** [CKEditor 5 toolbar items](#ckeditor-5-toolbar-items) · [CKEditor 5 premium features (only if the project uses them)](#ckeditor-5-premium-features-only-if-the-project-uses-them) · [Options and API](#options-and-api) · [Content](#content) · [CKEditor 4](#ckeditor-4)

## CKEditor 5 toolbar items

| CKEditor 5 item | Froala | Notes |
|---|---|---|
| `heading` | `paragraphFormat` | Map `heading.options` to the `paragraphFormat` option |
| `bold`, `italic`, `underline`, `strikethrough` | `bold`, `italic`, `underline`, `strikeThrough` | |
| `subscript`, `superscript`, `code` | `subscript`, `superscript`, `inlineStyle` | Inline code: define a style in `inlineStyles`, or a custom command |
| `fontFamily`, `fontSize` | `fontFamily`, `fontSize` | Copy the option lists |
| `fontColor`, `fontBackgroundColor`, `highlight` | `textColor`, `backgroundColor` | Highlight markers become background colours |
| `lineHeight` (premium) | `lineHeight` | |
| `alignment` | `align` | Or `alignLeft`, `alignCenter`, `alignRight`, `alignJustify` |
| `bulletedList`, `numberedList` | `formatUL`, `formatOL` | List styles: `listAdvancedTypes` |
| `multiLevelList` (premium) | `formatOL` with `listAdvancedTypes` | Mapped with differences: compare the numbering styles the documents use |
| `todoList` | No built-in equivalent | Stored to-do lists load as lists with checkboxes; toggling needs a custom plugin |
| `outdent`, `indent` | `outdent`, `indent` | |
| `link` | `insertLink` | Link decorators → `linkAttributes` / `linkStyles` |
| `insertImage`, `uploadImage` | `insertImage` | |
| `toggleImageCaption`, `imageTextAlternative`, `resizeImage` | `imageCaption`, `imageAlt`, `imageSize` | In Froala's image popup (`imageEditButtons`) |
| `ckbox`, `ckfinder` | `imageManager`, `filesManager`, or `filestack` | Different services: plan where files are stored |
| `insertTable` | `insertTable` | |
| `tableProperties`, `tableCellProperties` | `tableProperties`, `tableCellProperties` | In Froala's table popup (`tableEditButtons`) |
| `mediaEmbed` | `insertVideo` | See "Content": CKEditor can store `oembed` elements |
| `htmlEmbed` | `html` (code view) | No embed widget: raw HTML blocks are edited in code view; keep their tags in `htmlAllowedTags` |
| `blockQuote`, `codeBlock`, `horizontalLine` | `quote`, `codeSnippet`, `insertHR` | `codeSnippet` needs Froala 5.0+ |
| `pageBreak`, `specialCharacters`, `emoji` | `pageBreak`, `specialCharacters`, `emoticons` | |
| `findAndReplace`, `sourceEditing`, `removeFormat` | `findReplaceButton`, `html`, `clearFormatting` | |
| `undo`, `redo`, `selectAll`, `fullscreen` | `undo`, `redo`, `selectAll`, `fullscreen` | |
| `bookmark` | `insertAnchor` | Anchors inside the document |
| `style` | `paragraphStyle`, `inlineClass` | Map `style.definitions`: block styles → `paragraphStyles`, inline → `inlineClasses` |
| `accessibilityHelp` | `help` | Lists Froala's keyboard shortcuts |
| `showBlocks`, `textPartLanguage`, `restrictedEditing` | No built-in equivalent | Custom plugin, or drop with the user's agreement. Restricted editing can sometimes be replaced by `contenteditable="false"` regions |
| `mention` (feature, no button) | No built-in plugin | Froala's Tribute.js example (https://froala.com/wysiwyg-editor/examples/tribute-js/); keep stored mention markup with `htmlAllowedAttrs` |
| `WordCount` plugin | `wordCounter`, `charCounter` | |
| `Autosave` plugin | `save` — `saveURL`, `saveInterval` | Or keep the app's own save on `contentChanged` |

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
| `pasteFromOfficeEnhanced` | `wordPaste` | Compare results with real Word / Google Docs content |
| `insertTemplate`, `insertMergeField` | No built-in plugin | Custom dropdown command that inserts HTML with `html.insert()`; keep the merge-field syntax the server expects |
| `caseChange` | No built-in plugin | Custom command |
| `insertFootnote`, `tableOfContents` | No built-in plugin | Existing markup loads; editing support needs a custom plugin |
| Pagination (`pageNavigation`) | No equivalent | Froala does not paginate while editing; `pageBreak` marks breaks for print and export |
| `slashCommand` | `quickInsert` | Mapped with differences: Froala's quick-insert menu (`quickInsertButtons`) appears on empty lines; it is not typed with `/` |

## Options and API

| CKEditor 5 | Froala | Notes |
|---|---|---|
| `ClassicEditor.create(element, config)` | `new FroalaEditor(selector, options)` | Inline/balloon editors → `toolbarInline`. Decoupled editor (toolbar elsewhere) → `toolbarContainer` |
| `licenseKey` | `key` | |
| `placeholder` | `placeholderText` | |
| `language` | `language` | Load the Froala language file |
| `toolbar.items` | `toolbarButtons` | `toolbar.shouldNotGroupWhenFull` → `toolbarButtons` groups and `toolbarButtonsMD` / `SM` / `XS` |
| `simpleUpload.uploadUrl`, `simpleUpload.headers`, `simpleUpload.withCredentials` | `imageUploadURL`, `requestHeaders`, `requestWithCredentials` | Response key differs, see below |
| custom `UploadAdapter` | `image.beforeUpload` event + `image.insert()` | Read `editor.image.get()` once (the image being replaced, or `null`) and upload the files yourself. Insert one file at a time with `editor.image.insert(url, false, null, replacing)` for the first file and `null` for the rest, waiting for `image.inserted` / `image.replaced` before the next insert and calling `editor.selection.setAfter()` on the previous image first (otherwise later images land at the start of the document). Return `false` so Froala skips its own upload. Full code (if installed): the froala-filestack-integration skill, "Manual Interception" |
| `htmlSupport` (General HTML Support) | `htmlAllowedTags`, `htmlAllowedAttrs` | Extend Froala's defaults; still sanitize on the server |
| `editor.getData()` / `setData()` | `html.get()` / `html.set()` | |
| `editor.model.document.on('change:data')` | `contentChanged` event | |
| `editor.enableReadOnlyMode(lockId)` / `disableReadOnlyMode(lockId)` | `edit.off()` / `edit.on()` | |
| `editor.destroy()` | `destroy()` | |

<!-- validate:skip -->
**Upload responses differ.** The CKEditor 5 simple upload adapter reads `{ "url": "…" }` (or `{ "urls": { "default": "…" } }`); CKEditor 4 expects `{ "uploaded": 1, "fileName": "…", "url": "…" }`. Froala reads `{ "link": "…" }`. During the migration the endpoint can add `link` next to the existing keys: `{ "url": url, "link": url }`. The CKEditor 5 adapter sends the file in a form field named `upload`; Froala sends `file` unless you set `imageUploadParam: 'upload'`.
<!-- validate:end -->

## Content

<!-- validate:skip -->
CKEditor 5 stores HTML from `getData()`. Watch for:

- **Media embeds stored as `<oembed url="…">`** inside `<figure class="media">` (`mediaEmbed.elementName` defaults to `oembed`; previews are only stored when `mediaEmbed.previewsInData` is on). `oembed` is not in Froala's default `htmlAllowedTags`, and browsers do not render it: convert these to `<iframe>` embeds (YouTube, Vimeo…) or links in the migration script.
- **Images:** `<figure class="image">` with `image-style-*` (alignment) and `image_resized` + `style="width:…"` classes. Alignment comes from CKEditor's CSS classes, which Froala cannot read without that CSS: convert `image-style-align-left` / `-right` / `-block-…` / `-side` to Froala classes (`fr-fil`, `fr-fir`, `fr-dib`, `fr-dii`) in the script. Captions (`<figcaption>`) load as HTML; Froala's own caption markup is created by its `imageCaption` button.
- `<figure class="table">` wrappers load as they are; tables inside keep working.
- Display pages use the `ck-content` class: switch them to `fr-view` and `froala_style.min.css`.
<!-- validate:end -->

## CKEditor 4

<!-- validate:skip -->
CKEditor 4 also stores HTML, so content usually loads directly. Check `contentsCss` styles the content
relied on, and plugins that wrote special markup (`image2` captioned images as `<figure class="image">` with `<figcaption>`,
`embed` / `embedsemantic` media as `<oembed>`, `codesnippet` with highlight.js classes).
<!-- validate:end -->

| CKEditor 4 | Froala | Notes |
|---|---|---|
| `CKEDITOR.replace('id', config)` / `CKEDITOR.inline` | `new FroalaEditor('#id', options)` / `toolbarInline: true` | |
| `config.toolbar` / `toolbarGroups` | `toolbarButtons` | `Bold` → `bold`, `Italic` → `italic`, `Underline` → `underline`, `Strike` → `strikeThrough`, `NumberedList` → `formatOL`, `BulletedList` → `formatUL`, `Link` → `insertLink`, `Anchor` → `insertAnchor`, `Image` → `insertImage`, `Table` → `insertTable`, `HorizontalRule` → `insertHR`, `SpecialChar` → `specialCharacters`, `Blockquote` → `quote`, `Format` → `paragraphFormat`, `Font` → `fontFamily`, `FontSize` → `fontSize`, `TextColor` → `textColor`, `BGColor` → `backgroundColor`, `JustifyLeft`… → `alignLeft`…, `RemoveFormat` → `clearFormatting`, `Maximize` → `fullscreen`, `Find` / `Replace` → `findReplaceButton`, `Source` → `html` |
| `extraPlugins`, `removePlugins` | `pluginsEnabled`, `pluginsDisabled` | Check every custom `extraPlugins` entry: each needs a Froala equivalent or a custom plugin |
| `allowedContent`, `extraAllowedContent` (ACF) | `htmlAllowedTags`, `htmlAllowedAttrs` | |
| `contentsCss` | `iframe: true` + `iframeStyleFiles` | CKEditor 4's classic editor edits inside an iframe too |
| `enterMode` | `enter` | `CKEDITOR.ENTER_P` / `ENTER_BR` / `ENTER_DIV` → `FroalaEditor.ENTER_P` / `ENTER_BR` / `ENTER_DIV` |
| `format_tags`, `font_names`, `fontSize_sizes`, `stylesSet` | `paragraphFormat`, `fontFamily`, `fontSize`, `paragraphStyles` / `inlineClasses` | |
| `uploadUrl`, `imageUploadUrl`, `filebrowserUploadUrl` | `imageUploadURL` (`fileUploadURL` for files) | Response format above |
| `editor.getData()` / `setData()` / `insertHtml()` | `html.get()` / `html.set()` / `html.insert()` | |
| `editor.on('change')` | `contentChanged` event | |
| `readOnly`, `editor.setReadOnly()` | `edit.off()` / `edit.on()` | |
| `editor.destroy()` | `destroy()` | |
