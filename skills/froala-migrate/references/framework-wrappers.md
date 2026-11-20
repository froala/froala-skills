# Swapping framework wrappers

The old editor's wrapper is replaced by Froala's official wrapper for the same framework. Keep the
component's **external contract** (props / inputs, the value it emits, the form field name) so the rest
of the app does not change. Install and set up Froala's wrapper following its README on npm and Froala's
[framework guides](https://froala.com/wysiwyg-editor/docs/framework-plugins/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate); install `froala-editor` at the exact
version the wrapper pins.

## Value binding and change events

Competitor names below were checked in the wrappers' published type definitions (versions in brackets).

| Existing wrapper | Its value / change API | Froala wrapper equivalent |
|---|---|---|
| `@tinymce/tinymce-react` (6.3.1) | `value` / `initialValue`, `onEditorChange(content, editor)`, `init={{…}}`, `licenseKey`, `apiKey` | `<FroalaEditorComponent model={html} onModelChange={setHtml} config={config} />` (`react-froala-wysiwyg`); licence key in `config.key` |
| `@ckeditor/ckeditor5-react` (12.0.0) | `editor`, `config`, `data`, `onChange(event, editor)` + `editor.getData()`, `onReady(editor)`, `disabled` | `model` / `onModelChange` (receives the HTML); `ref.current.getEditor()` for the API; read-only through `getEditor()?.edit.off()` |
| `react-quill-new` (3.8.3) / `react-quill` | `value`, `onChange(html, delta, source, editor)`, `modules`, `formats`, `theme` | `model` / `onModelChange`; `config.toolbarButtons` replaces `modules.toolbar` |
| `@tiptap/react` (3.34.0) | `useEditor({ extensions, content, onUpdate })` + `<EditorContent editor={editor} />` | `<FroalaEditorComponent model onModelChange config />`; or Froala headless mode if the app keeps its own toolbar |
| `@tinymce/tinymce-vue` (6.3.0) | `v-model` (`modelValue`), `:init`, `api-key` | `<froala tag="textarea" :config="config" v-model:value="html">` (`vue-froala-wysiwyg`). Plain `v-model` does not work |
| `@ckeditor/ckeditor5-vue` (9.0.0) | `<ckeditor :editor :config v-model>` | `<froala :config v-model:value>` |
| `@tinymce/tinymce-angular` (9.1.2) | `<editor [init] [(ngModel)]>` or a reactive form control | `<div [froalaEditor]="options" [(froalaModel)]="html">` (`angular-froala-wysiwyg`); the `[froalaEditor]` directive is also a form control (reactive forms and ngModel) |
| `@ckeditor/ckeditor5-angular` (13.0.0) | `<ckeditor [editor] [config] [(ngModel)] (change)>` | `[froalaEditor]` + `[(froalaModel)]` or a form control |
| `ngx-quill` (30.1.3) | `<quill-editor [(ngModel)] format="html\|object\|json\|text">` | `[froalaEditor]` + `[(froalaModel)]`; **HTML only**. If `format` was `object` or `json`, convert stored content first (`content-conversion.md`) |

Display components: TinyMCE/CKEditor apps often render saved HTML with `dangerouslySetInnerHTML` /
`v-html` / `[innerHTML]` inside a `ck-content` or editor-specific class. Switch the container class to `fr-view`
and load `froala_style.min.css`, or use Froala's view components (`FroalaEditorView` in React, `<froalaView>`
in Vue, `[froalaView]` in Angular). They do not sanitize; keep the app's sanitizing step.

## Things that behave differently

- **Config is read once.** Froala's React wrapper reads `config` when the editor starts. Define it outside the component (or memoize it); to change options later, use the editor API or re-mount.
- **Content set from code.** `html.set()` / `html.insert()` through `getEditor()` do not reach `onModelChange` / `v-model:value` / `froalaModel` until `editor.undo.saveStep()` is called.
- **First change event.** Up to `react-froala-wysiwyg` 5.5.0, `onModelChange` also fires once on load with unchanged content; 5.6.0 fires only on real changes. Don't mark a document dirty on that first call when on 5.5.0 or older.
- **Form posts.** If the old editor posted a hidden `<textarea name="body">`, use `tag="textarea"` (React/Vue) or keep a form control with the same name, and test a real submit.
- **SSR.** Froala needs the DOM. Render the editor on the client only, as the old wrapper probably did (`dynamic(..., { ssr: false })`, `<ClientOnly>`, Angular `@defer`).

## Minimal React swap

```jsx
import FroalaEditorComponent from 'react-froala-wysiwyg';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';

const config = {
  key: import.meta.env.VITE_FROALA_KEY,
  placeholderText: 'Write something…',
  toolbarButtons: ['bold', 'italic', 'underline', '|', 'formatUL', 'formatOL', '|', 'insertLink', 'insertImage'],
  imageUploadURL: '/api/uploads', // must answer { "link": "…" }
};

// Same props as the old <RichTextEditor value onChange /> component, so callers don't change.
export default function RichTextEditor({ value, onChange }) {
  return <FroalaEditorComponent tag="textarea" config={config} model={value} onModelChange={onChange} />;
}
```
