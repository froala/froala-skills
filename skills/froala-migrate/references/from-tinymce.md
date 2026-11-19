# TinyMCE → Froala

Identifiers checked against `tinymce` 8.10.2 (open-source plugins) and the premium plugin identifiers
listed in Tiny's own agent skill (`tinymce/tinymce-ai-skills`, `skills/tinymce-setup/SKILL.md`).
Official Froala guide: https://froala.com/wysiwyg-editor/docs/migration-guides/from-tinymce-to-froala/
Froala names checked against `froala-editor` 5.6.0 (CI re-checks the Froala column).
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
| `accordion` | No built-in equivalent | `details` / `summary` are in Froala's default `htmlAllowedTags`, so existing accordions load. Add an insert button as a custom command (`froala-custom-plugins`) |
| `insertdatetime` | No built-in equivalent | Custom command that calls `html.insert()` with the formatted date |
| `nonbreaking` | No built-in button | Custom command inserting `&nbsp;`, or add it to a `specialCharactersSets` entry |
| `visualblocks`, `visualchars` | No built-in equivalent | Usually dropped; `codeView` (`html` button) shows the markup |

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
| `ai` (legacy AI Assistant) | `aiAssist` — `aiAssist` | Same as `tinymceai`: the project's backend calls the AI provider through `aiAssistRequest` |
| `mentions` | No built-in plugin | Froala's Tribute.js example (https://froala.com/wysiwyg-editor/examples/tribute-js/) attaches an `@` autocomplete to `editor.el`. Keep the stored mention markup with `htmlAllowedAttrs` |
| `mergetags`, `advtemplate` | No built-in plugin | Custom dropdown command that inserts the tag or template HTML with `html.insert()`; keep the project's tag syntax unchanged so the server-side merge still works |
| `checklist` | No built-in plugin | Existing checklist markup is kept (`data-*` and classes are allowed); toggling needs a custom plugin |
| `casechange`, `permanentpen` | No built-in plugin | Custom commands; `paintFormat` covers copying formatting |
| `footnotes`, `tableofcontents` | No built-in plugin | Existing markup loads as HTML. A table of contents can be a custom command that reads the headings and uses `linkToAnchor` anchors |
| `math` | No built-in plugin | Third-party MathType plugin for Froala (Wiris, `@wiris/mathtype-froala`); check its licence and Froala 5 support. Formulas already stored as MathML or images load as HTML |
| `linkchecker` | No built-in plugin | Run link checks on the server or as a custom plugin |

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
| `menubar` | No menu bar | Put the menu actions the users need in `toolbarButtons` (groups, `|` separators) |
| `toolbar` | `toolbarButtons` (+ `toolbarButtonsMD`, `toolbarButtonsSM`, `toolbarButtonsXS`) | |
| `toolbar_sticky` | `toolbarSticky`, `toolbarStickyOffset` | |
| `forced_root_block` | `enter` | `FroalaEditor.ENTER_P` (default), `FroalaEditor.ENTER_DIV`, `FroalaEditor.ENTER_BR` |
| `block_formats` | `paragraphFormat` | |
| `font_family_formats`, `font_size_formats` | `fontFamily`, `fontSize` (+ `fontSizeUnit`) | |
| `style_formats` | `paragraphStyles`, `inlineClasses`, `inlineStyles` | Block styles → `paragraphStyles`; inline classes → `inlineClasses`; inline CSS → `inlineStyles` |
| `color_map` | `colorsText`, `colorsBackground` | |
| `link_default_target`, `link_list` | `linkAlwaysBlank`, `linkList` | |
| `browser_spellcheck` | `spellcheck` | |
| `paste_as_text` | `pastePlain` | |
| `paste_data_images` | `imagePaste` | Pasted images are uploaded to `imageUploadURL` |
| `valid_elements`, `extended_valid_elements` | `htmlAllowedTags`, `htmlAllowedAttrs` | Extend Froala's defaults instead of replacing them; still sanitize on the server |
| `content_css`, `content_style` | `iframe: true` with `iframeStyleFiles` / `iframeStyle`, or CSS scoped to `editorClass` | Froala's official guide suggests `editorClass` or `iframeStyle`. Display pages use `fr-view` |
| `images_upload_url` | `imageUploadURL` | Response key differs, see below |
| `images_upload_handler` that only adds headers or fields | `requestHeaders`, `requestWithCredentials`, `imageUploadParams`, `imageUploadParam`, `imageUploadMethod` | No custom code needed |
| `images_upload_handler` with its own upload (signed URLs, SDK) | `image.beforeUpload` event + `image.insert()` | Return `false` to take over the upload; the pattern is in `froala-filestack-integration` |
| `image_list` | `imageManagerLoadURL` (`imageManager`) | Endpoint returns the image list as JSON |
| `license_key` / Tiny Cloud API key | `key` | Froala activation key |
| `readonly: true`, `editor.mode.set('readonly')` | `edit.off()` / `edit.on()` | Call after `initialized` |
| `setup` + `editor.on('init')` | `initialized` event | |
| `setup` + `editor.on('change')` / `'input'` | `contentChanged` event | |
| `editor.on('focus')` / `'blur'` | `focus` / `blur` events | |
| `editor.getContent()` / `setContent()` / `insertContent()` | `html.get()` / `html.set()` / `html.insert()` | |
| `editor.selection.getContent()` | `html.getSelected()` | |
| `editor.execCommand('Undo')` / `'Redo'` | `commands.undo()` / `commands.redo()` | |
| `editor.remove()` / `tinymce.remove()` | `destroy()` | |

<!-- validate:skip -->
**Upload responses differ.** TinyMCE expects `{ "location": "…" }`; Froala expects `{ "link": "…" }`. During the migration the same endpoint can return both: `{ "location": url, "link": url }`. TinyMCE sends the file in a form field named `file`; Froala's default field is also `file` (`imageUploadParam`).
<!-- validate:end -->

## Content

TinyMCE stores HTML, which Froala loads with `html.set()`. Check:

- image alignment: TinyMCE writes inline styles (`float`, `margin`) by default. On load Froala converts them to its classes `fr-fil`, `fr-fir`, `fr-dib`, `fr-dii` (see `content-conversion.md`). If the project configured alignment **classes** in TinyMCE, convert them in the script,
- `media` embeds (`iframe` / `video`) and any project-specific classes,
- `data-mce-*` attributes, only present if the app saved the editor's DOM instead of `getContent()`: remove them in the script,
- the display CSS: replace TinyMCE content CSS on display pages with `froala_style.min.css` and the `fr-view` class.
