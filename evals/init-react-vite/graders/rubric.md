---
type: llm
---

PASS if the answer: installs `froala-editor` and `react-froala-wysiwyg` (at matching versions, or says they must match); renders `FroalaEditorComponent` with `model` bound to state and `onModelChange` updating it; and puts the license in the `config` object under the `key` option.
FAIL if it uses jQuery, a `licenseKey` option, `<textarea>` + `new FroalaEditor` inside React without cleanup, or invents components or props.
