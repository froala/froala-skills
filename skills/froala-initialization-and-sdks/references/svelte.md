# Froala with Svelte and SvelteKit

Part of the froala-initialization-and-sdks skill (verified against froala-editor 5.6.0). Install commands, CDN rules, the licence `key` and the default toolbar config are in that skill's SKILL.md.

```svelte
<script>
  import FroalaEditor from 'svelte-froala-wysiwyg';
  import 'froala-editor/js/plugins.pkgd.min.js';
  import 'froala-editor/css/froala_editor.pkgd.min.css';
  import 'froala-editor/css/froala_style.min.css';

  let html = '<p>Hello from Svelte!</p>';
  let editor; // the Froala instance, if you need its API
  const config = {
    key: import.meta.env.VITE_FROALA_KEY || 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Froala's public trial key: set your licence key before production
    toolbarButtons: ['undo', 'redo', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', '|', 'formatUL', 'formatOL'],
    paragraphFormat: { N: 'Normal text', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3' },
    paragraphFormatSelection: true,
    listAdvancedTypes: false,
    heightMin: 300,
  };
</script>

<FroalaEditor bind:model={html} bind:editor {config} />
```

**SvelteKit renders on the server first.** In the route that shows the editor, add `export const ssr = false;` to its `+page.js` (or `+page.ts`). Otherwise the server render fails with `ReferenceError: Element is not defined`. TypeScript: `svelte-froala-wysiwyg` ships no type declarations.
