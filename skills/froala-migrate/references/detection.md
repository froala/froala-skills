# Detecting the existing editor

Check `package.json` (and the lockfile), imports, `<script>` / `<link>` tags and initialization code.
Record the editor, its version, the framework wrapper, and the **stored content format**.

<!-- validate:skip -->
| Editor | npm packages | Init / usage in code | Stored content |
|---|---|---|---|
| TinyMCE | `tinymce`, `@tinymce/tinymce-react`, `@tinymce/tinymce-vue`, `@tinymce/tinymce-angular` | `tinymce.init({ selector, plugins, toolbar })`, `<Editor apiKey=… init={…}>`, CDN script from the Tiny Cloud | HTML |
| CKEditor 5 | `ckeditor5`, `ckeditor5-premium-features`, legacy `@ckeditor/ckeditor5-build-*`, `@ckeditor/ckeditor5-react` / `-vue` / `-angular` | `ClassicEditor.create(...)` (also `DecoupledEditor`, `InlineEditor`, `BalloonEditor`), `<CKEditor editor={ClassicEditor} config={…}>` | HTML (from `getData()`) |
| CKEditor 4 | `ckeditor4`, `ckeditor4-react`, `ckeditor4-vue`, CDN `ckeditor.js` | `CKEDITOR.replace('id', { toolbar, extraPlugins })` | HTML |
| Quill | `quill`, `react-quill`, `react-quill-new`, `ngx-quill`, `@vueup/vue-quill` | `new Quill('#el', { modules: { toolbar }, formats })` | Delta JSON **or** HTML — check what the app saves, and whether HTML came from `getSemanticHTML()` or `root.innerHTML` (see `content-conversion.md`) |
| Tiptap | `@tiptap/core`, `@tiptap/react`, `@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-*` | `new Editor({ extensions })`, `useEditor({ extensions })` | JSON (`getJSON()`) or HTML (`getHTML()`) |
| ProseMirror | `prosemirror-view`, `prosemirror-state`, `prosemirror-model` | `new EditorView(...)` with a custom schema | JSON (schema-specific) |
| Summernote | `summernote` (jQuery) | `$('#el').summernote({ toolbar })` | HTML |
| Jodit | `jodit`, `jodit-react`, `jodit-vue` | `Jodit.make('#el', { buttons })` | HTML |
| Lexical | `lexical`, `@lexical/react` | `createEditor(...)`, `<LexicalComposer>` | Lexical JSON |
| Slate | `slate`, `slate-react` | `createEditor()`, `<Slate>` / `<Editable>` | Slate JSON (app-specific schema) |
| Draft.js | `draft-js`, `react-draft-wysiwyg` | `<Editor editorState=…>`, `convertToRaw` | Draft.js raw JSON |
| Editor.js | `@editorjs/editorjs` | `new EditorJS({ tools })` | Editor.js blocks JSON |
| Trix (standalone) | `trix` | `<trix-editor>` | HTML (with Trix attachment markup) |
| Rails Action Text | `actiontext` (Rails), `@rails/actiontext` + `trix` | `has_rich_text`, `form.rich_text_area` / `rich_textarea` | HTML with `<action-text-attachment sgid="…">` elements that point to application records |
| Toast UI Editor | `@toast-ui/editor`, `@toast-ui/react-editor` | `new Editor({ el, initialEditType })` | Markdown or HTML |
| RichTextEditor (richtexteditor.com, commercial) | `@richscripts/richtexteditor`, or self-hosted `richtexteditor/rte.js` + `plugins/all_plugins.js` | `new RichTextEditor('#div_editor1', config)`, `getHTMLCode()` / `setHTMLCode()`; may be attached to a named `<textarea>` that posts with a form | HTML |
| Redactor (Imperavi, commercial) | Not on npm; self-hosted `redactor.js` | Current: `Redactor('#entry', { plugins })`, `app.editor.getContent()`. Redactor X: `RedactorX(...)`. Redactor 3 (legacy): `$R('#content')`, `$R('#content', 'source.getCode')` | HTML (current version can also export JSON with `getJson()`) |
| Kendo UI for jQuery Editor (commercial) | Kendo UI for jQuery distribution or CDN (`@progress/kendo-ui`) | `$('#editor').kendoEditor({...})`, `$('#editor').data('kendoEditor')`, `value()` / `encodedValue()` | HTML; the textarea **submits encoded HTML by default** (`encoded: true`) |
| SunEditor (MIT) | `suneditor`; React: `@suneditor/suneditor-react` (v3) or `suneditor-react` (v2) | v3: `suneditor.create('#el', { plugins })`, `editor.$.html.get()`. v2: `SUNEDITOR.create(...)`, `editor.getContents()` | HTML |
| pell (MIT) | `pell` | `pell.init({ element, onChange: html => …, actions })` or `import { init } from 'pell'` | HTML passed to `onChange`, unless the app transforms it |
<!-- validate:end -->


**Ask, don't guess, when:**

- two editors are present (which one is being migrated?),
- the stored format is unclear (look at the API or database code that saves content),
- content is rendered on other channels (emails, mobile apps, PDFs) that depend on the old markup.
