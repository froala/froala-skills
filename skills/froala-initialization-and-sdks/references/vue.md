# Froala with Vue 3 and Nuxt

Part of the froala-initialization-and-sdks skill (verified against froala-editor 5.6.0). Install commands, CDN rules, the licence `key` and the default toolbar config are in that skill's SKILL.md.

```js
// main.js (main.ts in TypeScript projects)
import { createApp } from 'vue';
import App from './App.vue';
import 'froala-editor/js/plugins.pkgd.min.js';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
// es/index.js is published as CommonJS, so the default export may arrive wrapped (Vite 8).
// This form (from the vue-froala-wysiwyg README) works whichever way the bundler resolves the package.
import * as VueFroalaModule from 'vue-froala-wysiwyg';
const VueFroala = VueFroalaModule.default?.default ?? VueFroalaModule.default;

createApp(App).use(VueFroala).mount('#app');
```

**TypeScript projects** (the usual `create-vue` choice): `vue-froala-wysiwyg` ships no type declarations, and `npm run build` fails with TS7016 until you add a declaration file, for example `src/vue-froala-wysiwyg.d.ts`:

```ts
declare module 'vue-froala-wysiwyg';
```

```vue
<template>
  <froala tag="textarea" :config="config" v-model:value="content"></froala>
</template>

<script setup>
import { ref } from 'vue';
const content = ref('<p>Hello from Vue!</p>');
const config = {
  key: import.meta.env.VITE_FROALA_KEY || 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Froala's public trial key: set your licence key before production
  toolbarButtons: ['undo', 'redo', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', '|', 'formatUL', 'formatOL'],
  paragraphFormat: { N: 'Normal text', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3' },
  paragraphFormatSelection: true,
  listAdvancedTypes: false,
  heightMin: 300,
};
</script>
```

- The component is **`<froala>`** (and `<froalaView v-model:value="content">` for read-only display), not `<froala-editor>`.
- Use **`v-model:value`**. Plain `v-model` never receives changes: the wrapper only emits `update:value`.
- **Vite 8 and `vue-froala-wysiwyg` 5.6.0:** with a plain `import VueFroala from 'vue-froala-wysiwyg'`, `app.use()` gets `{ default: plugin }`. The editor never appears. In dev the console only shows the Vue warnings "A plugin must either be a function or an object with an 'install' function" and "Failed to resolve component: froala"; a production build shows nothing at all. Vite 7 is not affected. The import in `main.js` above fixes it (checked in dev and production builds).
- `npm install vue-froala-wysiwyg` prints "npm warn deprecated core-js@2.6.12". The wrapper's own dependencies cause it; it does not stop the build. Leave it alone; don't add overrides for it.
- To call the editor API, put a template ref on the component (`<froala ref="editorRef" …>`) and use `editorRef.value?.getEditor()`. After `html.insert()` or `html.set()`, call `editor.undo.saveStep()`, otherwise `v-model:value` doesn't get the change (see froala-methods-and-events).
- **Bundle size (optional):** the wrapper's `require('vue')` adds Vue's template compiler to the production bundle (about 93 kB, 33 kB gzipped). Its components use render functions, so the runtime-only build is enough: add `vue: 'vue/dist/vue.runtime.esm-bundler.js'` to `resolve.alias` in `vite.config.ts`.
- The wrapper reads `config` once, when the editor starts; it only watches `value`. To apply new options, re-create the component (for example by changing its Vue `:key`).
- **Nuxt:** register the plugin in a client-only plugin file (`plugins/froala.client.ts`) and render the editor inside `<ClientOnly>`.
