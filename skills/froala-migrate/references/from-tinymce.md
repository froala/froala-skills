# TinyMCE → Froala

Identifiers checked against `tinymce` 8.10.2 (open-source plugins) and the premium plugin identifiers
listed in Tiny's own agent skill (`tinymce/tinymce-ai-skills`, `skills/tinymce-setup/SKILL.md`).
Official Froala guide: https://froala.com/wysiwyg-editor/docs/migration-guides/ Froala names checked against `froala-editor` 5.6.0 (CI re-checks the Froala column).
Confirm anything doubtful in both products' current docs.

## Plugins

| TinyMCE plugin | Froala | Notes |
|---|---|---|
| `lists`, `advlist` | `lists` — `formatOL`, `formatUL` | List styles: `listAdvancedTypes` |
| `anchor` | `linkToAnchor` — `insertAnchor` | |
| `autolink` | `url` | Typed URLs become links |
| `autoresize` | `heightMin`, `heightMax` | Set the limits the old configuration used |
| `autosave` | `save` — `saveURL`, `saveInterval` | Different model: Froala's save plugin posts to your server; TinyMCE's autosave keeps a draft in browser local storage |
| `charmap` | `specialCharacters` — `specialCharacters` | |
| `code` | `codeView` — `html` | Syntax highlighting with `codeMirror` |
| `codesample` | `codeSnippet` — `codeSnippet` | Froala 5.0+ |
| `directionality` | `direction` option | Check whether users switch direction per paragraph |
| `emoticons` | `emoticons` — `emoticons` | |
| `fullscreen` | `fullscreen` — `fullscreen` | |
| `help` | `help` — `help` | |
| `image` | `image` — `insertImage` | Image editing: `imageTUI` or `imageFilerobot` (third-party files) |
| `importcss` | `paragraphStyle`, `inlineClass` — `paragraphStyles`, `inlineClasses` | Froala lists classes explicitly; it does not read them from a stylesheet |
| `link` | `link` — `insertLink` | |
| `media` | `video` — `insertVideo` | Rich embeds: `embedly` (third-party file) |
| `pagebreak` | `pageBreak` — `pageBreak` | Froala 4.7+ |
| `preview` | `html.get()` shown in an element with class `fr-view` | Load `froala_style.min.css` on the preview page |
| `quickbars` | `quickInsert`, `toolbarInline` | `quickInsertButtons` for the block menu |
| `save` | `save` — `save` | |
| `searchreplace` | `findReplace` — `findReplaceButton` | |
| `table` | `table` — `insertTable` | |
| `wordcount` | `wordCounter`, `charCounter` | `wordCounterMax`, `charCounterMax` |

### TinyMCE premium plugins (only if the project uses them)

| TinyMCE plugin | Froala | Notes |
|---|---|---|
| `powerpaste` | `wordPaste` — `wordPasteModal`, `wordPasteKeepFormatting` | Compare paste results with real Word/Google Docs content |
| `suggestededits` | `track_changes` — `trackChanges`, `showChanges`, `applyAll`, `removeAll` | `track_changes.min.js` is not in the pkgd bundles; also see collaborative suggestion mode |
| `tinycomments` | `collaborative` — `collabAddComment`, `collabPanel` | Froala 5.3+, needs a backend (`wysiwyg-editor-node-sdk`) |
| `revisionhistory` | `collaborative` — `versionControl` | Froala 5.3+ |
| `importword` | `importFromWord` — `import_from_word` | Froala 5.0+, converts in the browser with mammoth.js |
| `exportword` | `exportToWord` — `export_to_word` | Browser-side; output targets Microsoft Word |
| `exportpdf` | `print` — `getPDF` | Needs html2pdf.js loaded before Froala (or the `html2pdf` option); without it the button does nothing. Verify the downloaded PDF contains the document |
| `markdown` | `markdown` — `markdown` | `getMarkdown()` / `setMarkdown()` need Froala 5.4+ |
| `tinymceai` | `aiAssist` — `aiAssist`, `aiShortCuts`, `aiChatAssistant` | Bring your own AI provider through `aiAssistRequest` |
| `advtable` | `table` | Compare each advanced table feature the project uses |
| `advcode` | `codeView` — `html` | `codeMirror` for highlighting |
| `uploadcare` | `filestack` | Managed uploads through Filestack (`froala-filestack-integration`) |
| `tinymcespellchecker` | `spellChecker` | Third-party file `spell_checker.min.js`, which uses the WebSpellChecker service |
| `editimage` | `imageTUI` | Third-party file |
| `formatpainter` | `paintFormat` — `paintFormat` | Froala 5.6.0+. Copies inline formatting only; `paintFormatContinuous` keeps paint mode on |
| `a11ychecker` | `accessibilityChecker` — `accessibilityChecker` | Froala 5.6.0+. WCAG level in `accessibilityCheckerLevel` (default `AA`); compare the rules the project relies on, and any custom rules |

## Toolbar buttons

| TinyMCE button | Froala button |
|---|---|
| `bold`, `italic`, `underline` | `bold`, `italic`, `underline` |
| `strikethrough`, `subscript`, `superscript` | `strikeThrough`, `subscript`, `superscript` |
| `forecolor`, `backcolor` | `textColor`, `backgroundColor` |
| `fontfamily`, `fontsize`, `lineheight` | `fontFamily`, `fontSize`, `lineHeight` |
| `blocks` | `paragraphFormat` |
| `alignleft`, `aligncenter`, `alignright`, `alignjustify` | `alignLeft`, `alignCenter`, `alignRight`, `alignJustify` |
| `bullist`, `numlist`, `outdent`, `indent` | `formatUL`, `formatOL`, `outdent`, `indent` |
| `blockquote`, `hr`, `removeformat` | `quote`, `insertHR`, `clearFormatting` |
| `link`, `image`, `media`, `table` | `insertLink`, `insertImage`, `insertVideo`, `insertTable` |
| `code`, `codesample`, `charmap`, `emoticons` | `html`, `codeSnippet`, `specialCharacters`, `emoticons` |
| `searchreplace`, `pagebreak`, `anchor` | `findReplaceButton`, `pageBreak`, `insertAnchor` |
| `undo`, `redo`, `fullscreen`, `print`, `help` | `undo`, `redo`, `fullscreen`, `print`, `help` |

Froala puts every action in the toolbar: add TinyMCE's menu-bar actions to `toolbarButtons`.

## Options and API

| TinyMCE | Froala | Notes |
|---|---|---|
| `selector` / `target` | `new FroalaEditor(selector, options)` | |
| `height`, `min_height`, `max_height` | `height`, `heightMin`, `heightMax` | |
| `placeholder` | `placeholderText` | |
| `language` | `language` | Also load the Froala language file |
| `paste_as_text` | `pastePlain` | |
| `valid_elements`, `extended_valid_elements` | `htmlAllowedTags`, `htmlAllowedAttrs` | Still sanitize on the server |
| `content_css` | `iframe`, `iframeStyleFiles` | Or style the `fr-view` content class |
| `images_upload_url` | `imageUploadURL` | Response key differs, see below |
| `images_upload_handler` | `image.beforeUpload` event + `image.insert()` | Return `false` from the event to take over the upload |
| `license_key` / Tiny Cloud API key | `key` | Froala activation key |
| `readonly: true` | `edit.off()` | Call after `initialized` |
| `setup` + `editor.on('change')` | `contentChanged` event | |
| `editor.getContent()` / `setContent()` / `insertContent()` | `html.get()` / `html.set()` / `html.insert()` | |

**Upload responses differ.** TinyMCE expects `{ "location": "…" }`; Froala expects `{ "link": "…" }`. During the migration the same endpoint can return both: `{ "location": url, "link": url }`.

## Content

TinyMCE stores HTML, which Froala loads with `html.set()`. Check:

- image alignment (inline styles or the classes the project configured) → Froala uses `imageDefaultAlign` / `imageDefaultDisplay`, and the classes `fr-fil`, `fr-fir`, `fr-dib`, `fr-dii`,
- `media` embeds (`iframe` / `video`) and any project-specific classes,
- the display CSS: replace TinyMCE content CSS on display pages with `froala_style.min.css` and the `fr-view` class.
