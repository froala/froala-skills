# Froala with Next.js (App Router)

Part of the froala-initialization-and-sdks skill (verified against froala-editor 5.6.0). Install commands, CDN rules, the licence `key` and the default toolbar config are in that skill's SKILL.md.

Froala needs the browser DOM. Importing it during server rendering fails with `ReferenceError: Element is not defined`. **`'use client'` alone is not enough** — client components are still pre-rendered on the server. Load the editor with `next/dynamic` and `ssr: false`.

```jsx
// app/components/EditorClient.jsx
'use client';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';
import FroalaEditorComponent from 'react-froala-wysiwyg';

const config = {
  key: process.env.NEXT_PUBLIC_FROALA_KEY || 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Froala's public trial key: set your licence key before production
  toolbarButtons: ['undo', 'redo', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', '|', 'formatUL', 'formatOL'],
  paragraphFormat: { N: 'Normal text', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3' },
  paragraphFormatSelection: true,
  listAdvancedTypes: false,
  heightMin: 300,
};

export default function EditorClient({ model, onModelChange }) {
  return (
    <FroalaEditorComponent
      tag="textarea"
      model={model}
      onModelChange={onModelChange}
      config={config}
    />
  );
}
```

```jsx
// app/components/Editor.jsx
'use client';
import dynamic from 'next/dynamic';
export default dynamic(() => import('./EditorClient'), { ssr: false });
```

TypeScript: `froala-editor` ships type declarations for the core only (`index.d.ts`); the plugin files have none. A dynamic `import('froala-editor/js/plugins.pkgd.min.js')` can therefore fail type-checking with TS7016. Add a declaration file: `declare module 'froala-editor/js/plugins/*'; declare module 'froala-editor/js/plugins.pkgd.min.js';`
