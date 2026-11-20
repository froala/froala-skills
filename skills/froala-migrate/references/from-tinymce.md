# TinyMCE → Froala

Identifiers checked against `tinymce` 8.10.2 (open-source plugins) and the premium plugin identifiers
listed in Tiny's own agent skill (`tinymce/tinymce-ai-skills`, `skills/tinymce-setup/SKILL.md`,
`references/plugin-reference.md` and `references/editor-detection.md`, read 2026-11-20).
Official Froala guide: https://froala.com/wysiwyg-editor/docs/migration-guides/from-tinymce-to-froala/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate
Froala names checked against `froala-editor` 5.6.0 (CI re-checks the Froala column).
Confirm anything doubtful in both products' current docs.

**Contents:** [Plugins](#plugins) · [Toolbar buttons](#toolbar-buttons) · [Options and API](#options-and-api) · [Content](#content)

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
| `accordion` | No built-in equivalent | `details` / `summary` are in Froala's default `htmlAllowedTags`, so existing accordions load. Add an insert button as a custom command ([Custom button](https://froala.com/wysiwyg-editor/docs/concepts/custom/button/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate)) |
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
| `uploadcare` | `filestack` | Managed uploads through Filestack: `filestackOptions.filestackAPI`; the plugin needs the filestack-js 3.x `<script>` globals ([Filestack plugin](https://froala.com/wysiwyg-editor/docs/plugins/filestack-plugin/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate)) |
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

### TinyMCE premium plugin options and buttons

Options and toolbar buttons that TinyMCE's own setup skill configures for the premium plugins above.

| TinyMCE | Froala | Notes |
|---|---|---|
| `tinymceai-chat`, `tinymceai-quickactions`, `tinymceai-review` buttons | `aiChatAssistant`, `aiShortCuts` (+ `aiAssist`), `aiImproveWriting` | `aiShortCuts` holds only Change tone and Translate; Improve Writing is its own button |
| `tinymceai_token_provider`, `ai_request` | `aiAssistRequest` | Your function calls your own backend, which holds the provider key. Also set `aiSupplementalTermsAccepted: true` |
| `tinymceai_quickactions_change_tone_menu` | `aiAssistToneOptions` (and `aiAssistTranslateOptions`) | `{ title, prompt }` items |
| `tinymceai_quickactions_menu`, `tinymceai_quickactions_chat_prompts` | No equivalent option | Users type their own prompt in `aiAssist` or AI Chat |
| `addcomment` button | `collabAddComment` | |
| `tinycomments_mode`, `tinycomments_create`, `tinycomments_reply`, `tinycomments_edit_comment`, `tinycomments_delete`, `tinycomments_delete_all`, `tinycomments_delete_comment`, `tinycomments_lookup` | `collabConfig.commentsUrl` | Froala stores comments through one REST URL (the `CollabPersistence` routes of `wysiwyg-editor-node-sdk`), not per-action callbacks. Convert existing comment records on the server |
| `user_id`, `fetch_users` (commenter identity, mention list) | `collabConfig.user`, `collabConfig.mentionableUsers` | |
| `revisionhistory_fetch` | `collabConfig.versionControl.url` | Version history is stored by the SDK's `VersionControl` routes; existing revisions don't import automatically |
| `suggestededits` button | `trackChanges` | Put only `trackChanges` in `toolbarButtons`; it opens the sub-toolbar |
| `exportpdf`, `exportword`, `importword` buttons | `getPDF`, `export_to_word`, `import_from_word` | |
| `a11ycheck` button | `accessibilityChecker` | |
| `spellchecker` button | `spellChecker` | Third-party file `spell_checker.min.js` |
| `advtablerownumbering` button | No equivalent | |
| `uploadcare` button, `uploadcare_public_key` | `openFilePicker` (or the Insert Image popup's `openFilePickerImage`), `filestackOptions.filestackAPI` | Files already stored on Uploadcare keep their URLs |
| `mergetags_list`, `advtemplate_list` | `options` of a custom dropdown command (`FroalaEditor.RegisterCommand` with `type: 'dropdown'`) | The callback inserts the chosen tag or template with `html.insert()` |

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
| `images_upload_handler` with its own upload (signed URLs, SDK) | `image.beforeUpload` event + `image.insert()` | Read `editor.image.get()` once (the image being replaced, or `null`), upload the files yourself, call `editor.image.insert(url, false, null, replacing)` for the first file and pass `null` for the rest, and return `false` so Froala skips its own upload |
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
