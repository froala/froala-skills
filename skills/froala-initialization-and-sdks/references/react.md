# Froala with React

Part of the froala-initialization-and-sdks skill (verified against froala-editor 5.6.0). Install commands, CDN rules, the licence `key` and the default toolbar config are in that skill's SKILL.md.

```jsx
import { useRef, useState } from 'react';
import FroalaEditorComponent from 'react-froala-wysiwyg';

import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js'; // registers the plugins the toolbar below uses

// Outside the component: the wrapper reads config once, when the editor starts.
const config = {
  key: import.meta.env.VITE_FROALA_KEY || 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Froala's public trial key: set your licence key before production
  toolbarButtons: ['undo', 'redo', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', '|', 'formatUL', 'formatOL'],
  paragraphFormat: { N: 'Normal text', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3' },
  paragraphFormatSelection: true,
  listAdvancedTypes: false,
  heightMin: 300,
};

export default function MyEditor() {
  const [model, setModel] = useState('<p>Hello from React!</p>');
  const ref = useRef(null);

  return (
    <FroalaEditorComponent
      ref={ref}
      tag="textarea"
      config={config}
      model={model}
      onModelChange={setModel}
    />
  );
}
```

- To call editor methods, use `ref.current.getEditor()` (the typed, public API). Content you change through it (`html.insert()`, `html.set()`) does **not** reach `onModelChange` until you call `editor.undo.saveStep()` — see froala-methods-and-events.
- If you import single plugins instead of `plugins.pkgd.min.js`, import one for **every** toolbar button you use. A button whose plugin is missing is silently not rendered.
- The wrapper destroys the editor on unmount.
- To display saved content, use the wrapper's view component: `import FroalaEditorView from 'react-froala-wysiwyg/FroalaEditorView'`, then `<FroalaEditorView model={html} />`. It renders the HTML inside an `fr-view` element (it does not sanitize it).

**Vite 8 with `react-froala-wysiwyg` 5.5.0 or older:** the default import resolves to `{ default: … }` instead of the component, and React throws `Element type is invalid: expected a string … but got: object`. Vite 7 is not affected, and 5.6.0 fixes it. On an older version, upgrade or unwrap the import (this also works with 5.6.0 and other bundlers; do the same for `FroalaEditorView`):

```jsx
import FroalaEditorImport from 'react-froala-wysiwyg';
const FroalaEditorComponent = FroalaEditorImport.default ?? FroalaEditorImport;
```

**React wrapper behaviours to plan for:**

| Behaviour | What to do |
|---|---|
| After start, the wrapper only reacts to `model` changes; `config` changes are ignored | To apply a new config (language, placeholder…), give the component a React `key` that changes with it, so React starts a fresh editor |
| Setting `model` from your own code resets the undo history | Add the `skipReset` prop |
| React StrictMode (development only) mounts components, unmounts them and mounts them again, so the editor is created twice and `initialized` runs twice (three times up to 5.5.0) | Expected in development. Keep setup code idempotent and put handlers in `config.events` |
| Up to 5.5.0, `onModelChange` also fires once when the editor loads, with unchanged content. 5.6.0 calls it only on real changes | Don't treat the first call as a user edit (dirty flags, autosave) on 5.5.0 or older |
| `ref.current.initialize()` and `ref.current.destroy()` throw up to 5.5.0 | Use them from 5.6.0, or use `onManualControllerReady` on older versions |

TypeScript: from 5.6.0 the wrapper types its props. `config` is `Partial<FroalaOptions>` (a misspelled option name is a type error), `onModelChange` receives a `string`, and `getEditor()` returns `FroalaEditor | null`. Up to 5.5.0 the props were loosely typed (`config?: object`, `getEditor(): any`), so type the callback yourself: `onModelChange={(model: string) => setModel(model)}`.
