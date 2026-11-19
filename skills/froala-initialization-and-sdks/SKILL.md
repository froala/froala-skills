---
name: froala-initialization-and-sdks
description: >
  Use when setting up, installing, configuring or licensing the Froala WYSIWYG editor in any project:
  plain JavaScript or TypeScript (npm with any bundler, CDN, or self-hosted files), React, Next.js, Vue,
  Nuxt, Angular (standalone or NgModule, with or without SSR), Svelte, SvelteKit, or another official
  Froala integration (server frameworks and CMS plugins). Activates on froala-editor, react-froala-wysiwyg, vue-froala-wysiwyg,
  angular-froala-wysiwyg, svelte-froala-wysiwyg, new FroalaEditor(, FroalaEditorComponent, <froala>,
  [froalaEditor], toolbarButtons, toolbarButtonsXS, pluginsEnabled, pluginsDisabled, theme, the key option,
  froala_editor.pkgd.min.js, plugins.pkgd.min.js or froala_style.min.css. NOT for events and API methods
  (froala-methods-and-events), custom plugins (froala-custom-plugins) or diagnosing an editor that is
  already broken (froala-error-diagnosis).
license: MIT
metadata:
  version: "1.1.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-18"
---

# Froala Initialization & SDKs

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. A project that still calls `.froalaEditor()` on a jQuery object runs Froala 2: upgrading means switching to `new FroalaEditor(...)`. Names that start with `$` in the current API (`editor.$el`, the `$btn` passed to `refresh`, the `$popup` from `editor.popups.create`) are Froala's own DOM helpers, not jQuery: keep using them where the API hands them to you.

## Start here: find the version

1. Read the installed version from `node_modules/froala-editor/package.json` (or the project's `package.json`).
2. With no package manager (plain HTML), use the latest release: `npm view froala-editor version`.
3. In every CDN URL below, replace `VERSION` with that exact version. **Use the same version in every URL** — a CSS/JS mismatch breaks the editor.
4. This skill was checked against the version in `metadata.verified_against`. For a newer version, confirm option names in the [options docs](https://froala.com/wysiwyg-editor/docs/options/) before relying on them.

Wrapper packages (`react-froala-wysiwyg`, `vue-froala-wysiwyg`, `angular-froala-wysiwyg`, `svelte-froala-wysiwyg`) use the same version numbers as `froala-editor`. Keep them equal.

## Default setup

Use this when the user has not asked for a specific version, toolbar or licence setup and the project has no Froala configuration yet. If the project already configures Froala, keep its settings.

- **Version:** the latest release (`npm install froala-editor` plus the matching wrapper; for CDN URLs, `npm view froala-editor version`).
- **Key:** Froala's public trial key, `TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE` ([activation docs](https://froala.com/wysiwyg-editor/docs/activation/)). Every feature and plugin works, and the editor shows "You are using a 30-day trial version of Froala Editor, which is not for production use." The trial key never licenses a site: tell the user to set their licence key before going to production. In projects with a bundler, read the key from an environment variable and fall back to the trial key (as in the examples below), so production only needs the variable.
- **Toolbar:** a simple editor: undo and redo, a text-format dropdown that shows the current format ("Normal text", "Heading 1"…), bold, italic and underline, link and image, bulleted and numbered lists.

```js
const config = {
  key: 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Froala's public trial key: set your licence key before production
  toolbarButtons: ['undo', 'redo', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', '|', 'formatUL', 'formatOL'],
  paragraphFormat: { N: 'Normal text', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3' },
  paragraphFormatSelection: true,
  listAdvancedTypes: false,
  heightMin: 300,
};
```

- `paragraphFormatSelection: true` shows the current format in the dropdown instead of an icon. It reads "Paragraph Format" until the cursor is in the text.
- `listAdvancedTypes: false` gives plain list buttons, without the list-style dropdowns.
- `'|'` starts a new button group, shown as extra space.
- The same buttons show on every screen width: `toolbarButtonsMD`, `toolbarButtonsSM` and `toolbarButtonsXS` default to `null` and follow `toolbarButtons`. On a phone the toolbar wraps onto more rows.
- `insertImage` without an upload target inserts temporary `blob:` images that are lost after a reload. Before saving real content, set `imageUploadURL` (see froala-error-diagnosis) or remove `insertImage`.

## What Froala Provides

A complete WYSIWYG HTML editor with a ready-made toolbar UI. It outputs HTML via `editor.html.get()`.

- Plugins for images, tables, links, video, Word import/export, Markdown, Track Changes, collaboration, AI Assist and more
- AI Assist connects to your own provider — Froala does not ship a model
- Headless mode exists from 5.5.0 with limited feature support — evaluate it carefully before building a custom UI on it

### Added in 5.6.0

Both new plugins are in the `pkgd` bundles. Their buttons must still be listed in `toolbarButtons`.

| Feature | Toolbar button | Options (default) | API and events |
|---|---|---|---|
| Accessibility Checker: scans the content for WCAG issues (alt text, heading levels, colour contrast, table headers…) and repairs many of them in one click | `accessibilityChecker` | `accessibilityCheckerLevel` (`'AA'`), `accessibilityCheckerAutoCheck` (`false`), `accessibilityCheckerRules` (`[]`), `accessibilityCheckerMaxIssues` (`500`) | `editor.accessibilityChecker.check()` returns the findings without opening the popup; events `accessibilityChecker.shown`, `accessibilityChecker.repaired`, `accessibilityChecker.ignored` |
| Paint Format: copies the inline formatting of one selection and applies it to another | `paintFormat` | `paintFormatContinuous` (`false`) | `editor.paintFormat.copy()`, `editor.paintFormat.apply()`; events `paintFormat.start`, `paintFormat.applied`, `paintFormat.end` |
| Email links (with subject and body) and click-to-call phone links in the Insert Link popup | — | `linkEmailDomains` (`[]`), `linkPhonePattern`, `linkPhoneExample`, `linkPhoneErrorMessage` | — |
| Draggable popups, for example when a popup doesn't fit in fullscreen mode | — | `popupDraggable` (`false`) | — |

---

## Installation

### npm

```bash
npm install froala-editor              # core (always needed)
npm install react-froala-wysiwyg       # React / Next.js
npm install vue-froala-wysiwyg         # Vue 3 / Nuxt
npm install angular-froala-wysiwyg     # Angular
npm install svelte-froala-wysiwyg      # Svelte 5 / SvelteKit
```

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_editor.pkgd.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_style.min.css">
<script src="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/js/froala_editor.pkgd.min.js"></script>
```

Never use unversioned or `@latest` URLs in production: cached files can drift apart and break the editor.

Both stylesheets are required: `froala_editor.pkgd.min.css` styles the editor UI, `froala_style.min.css` styles the content. Load `froala_style.min.css` on pages that **display** saved content too, and wrap that content in an element with the `fr-view` class.

### Which bundle includes which plugins

| File | Contains |
|---|---|
| `js/froala_editor.min.js` | Core only — import each plugin from `js/plugins/<file>.min.js` |
| `js/froala_editor.pkgd.min.js` | Core + almost every plugin (AI Assist, Collaborative, Word import/export, Markdown, Filestack, Table, Image, Link, …) |
| `js/plugins.pkgd.min.js` | The same plugins without the core — use with `import 'froala-editor'` in bundlers |

**Not in either `pkgd` bundle** — load separately when needed:

- `js/plugins/track_changes.min.js`
- `js/plugins/trim_video.min.js`
- everything in `js/third_party/` (`embedly`, `font_awesome`, `image_tui`, `imageFileRobot`, `spell_checker`)

The plugin **file name**, the plugin **name** used in `pluginsEnabled`, and the **toolbar button** names are three different things. See `references/plugin-names.md`.

---

## Vanilla JavaScript

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_editor.pkgd.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_style.min.css">

<div id="editor">Hello, Froala!</div>

<script src="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/js/froala_editor.pkgd.min.js"></script>
<script>
  const config = {
    key: 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Froala's public trial key: set your licence key before production
    toolbarButtons: ['undo', 'redo', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', '|', 'formatUL', 'formatOL'],
    paragraphFormat: { N: 'Normal text', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3' },
    paragraphFormatSelection: true,
    listAdvancedTypes: false,
    heightMin: 300,
  };
  const editor = new FroalaEditor('#editor', config);
</script>
```

Place the scripts before `</body>`, or initialize inside `DOMContentLoaded`. `new FroalaEditor('#editor')` does nothing visible if the element does not exist yet.

---

## React

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

---

## Next.js (App Router)

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

---

## Vue 3

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
- **Nuxt:** register the plugin in a client-only plugin file (`plugins/froala.client.ts`) and render the editor inside `<ClientOnly>`.

---

## Angular

**Before `ng new`, check Node.js.** The Angular CLI refuses to start on a Node.js version outside its range ("The Angular CLI requires a minimum Node.js version of …"). CLI 22 needs `^22.22.3`, `^24.15.0` or 26+; CLI 21 accepts `^20.19.0`, `^22.12.0` or 24+. Compare `node --version` with `npm view @angular/cli engines`. If the installed Node.js is too old for the latest CLI, ask the user whether to update Node.js, or use the newest CLI that supports it (for example `npx @angular/cli@21 new my-app`). Don't change the user's Node.js on your own. `angular-froala-wysiwyg` supports Angular 19+.

New Angular apps use **standalone components**, and from Angular 21 they run without zone.js; the Froala directives work in both. Import the Froala modules directly in the component. Do **not** put `FroalaEditorModule.forRoot()` in a standalone component's `imports`: Angular rejects `forRoot()` results there with error NG2012 ("Component imports contains a ModuleWithProviders value…").

```typescript
// editor.ts (editor.component.ts in projects generated before Angular 20)
import { Component } from '@angular/core';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import 'froala-editor/js/plugins.pkgd.min.js';

@Component({
  selector: 'app-editor',
  imports: [FroalaEditorModule, FroalaViewModule],
  template: `
    <div [froalaEditor]="options" [(froalaModel)]="content"></div>
    <div [froalaView]="content"></div>
  `,
})
export class EditorComponent {
  content = '<p>Hello from Angular!</p>';
  options = {
    key: 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Froala's public trial key: set your licence key before production
    toolbarButtons: ['undo', 'redo', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', '|', 'formatUL', 'formatOL'],
    paragraphFormat: { N: 'Normal text', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3' },
    paragraphFormatSelection: true,
    listAdvancedTypes: false,
    heightMin: 300,
  };
}
```

Older NgModule apps: `imports: [FroalaEditorModule.forRoot(), FroalaViewModule.forRoot()]` in the `@NgModule`.

**Show the editor inside `@defer`** in the parent template (import `EditorComponent` in the parent's `imports` as usual):

```html
<!-- app.html -->
@defer (on idle) {
  <app-editor />
} @placeholder {
  <p>Loading editor…</p>
}
```

`@defer` moves the editor, the wrapper and Froala (about 2 MB) into a lazy chunk. Without it, a new project fails `ng build` with "bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 1.67 MB", and an SSR project also fails with `ReferenceError: document is not defined` while extracting routes. With it, the initial bundle is about 0.5 MB, and on the server the placeholder is rendered and Froala is never loaded (checked on Angular 21 with Froala 5.6.0, with and without SSR).

In `angular.json`, add the stylesheets **after** the project's own stylesheet (`ng new` creates it as `src/styles.css`), and acknowledge that `froala-editor` is CommonJS:

```json
"styles": [
  "src/styles.css",
  "node_modules/froala-editor/css/froala_editor.pkgd.min.css",
  "node_modules/froala-editor/css/froala_style.min.css"
],
"allowedCommonJsDependencies": ["froala-editor"]
```

Both go in `projects.<name>.architect.build.options`. `allowedCommonJsDependencies` removes the "Module 'froala-editor' … is not ESM" warnings, including the one for `froala-editor/js/plugins.pkgd.min.js`.

Angular tips:

- **SSR (`@angular/ssr`)**: use the `@defer` block above. `angular-froala-wysiwyg` imports `froala-editor` as soon as it is loaded, so guarding only the plugins import is not enough: any static import of the editor component reaches the server and fails with `ReferenceError: document is not defined` (`Element is not defined` in some setups).
- **Budget warning**: with `@defer` the build passes, but Froala's global stylesheet (about 300 kB) can still exceed the 500 kB *warning* budget for the initial bundle. It is a warning, not an error; raise `maximumWarning` if the team wants a clean log.
- **"2 rules skipped due to selector errors: 0% -> Unmatched selector: %"** in production builds: harmless. It comes from two old vendor-prefixed keyframes in Froala's CSS (`@-moz-keyframes loading`, `@-o-keyframes loading`) that Angular's critical-CSS step does not recognise. The full stylesheet still loads.
- **Editor API**: listen to `(froalaInit)` for `{ initialize, destroy, getEditor }`. Binding it switches the directive to manual start, so call `initialize()` yourself. Its payload is typed `Object`, so take it as `any` (example in froala-methods-and-events).
- **NG0751 in `ng serve`**: with hot module replacement on, Angular logs that `@defer` dependencies load eagerly. Expected in development only.
- **Reactive Forms**: up to 5.5.0, after `FormControl.reset()` the first edit does not update the form value. 5.6.0 fixes this by saving an undo step whenever the form writes a value into the editor. That step fires `contentChanged`, so your own `contentChanged` handlers also run when the form writes a value. Don't treat that call as a user edit.
- **Angular Material dialogs**: up to 5.5.0, image, link and table popups open behind Angular Material v21 dialogs. Fixed in 5.6.0.

---

## Svelte / SvelteKit

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

---

## Other Frameworks

Official integrations for other frameworks and CMSs are listed at https://froala.com/wysiwyg-editor/docs/framework-plugins/. Server-side upload handling is covered by the server integrations and SDKs: https://www.froala.com/wysiwyg-editor/docs/sdks/nodejs

---

## Common Configuration Options

```js
const config = {
  key: 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // or your licence key

  // Toolbar
  toolbarButtons: ['bold', 'italic', 'underline', '|', 'alignLeft', 'alignCenter',
    'alignRight', '|', 'formatOL', 'formatUL', '|', 'insertImage', 'insertLink', 'insertTable'],
  toolbarButtonsXS: {                       // toolbar for the smallest screens
    moreText: { buttons: ['bold', 'italic', 'underline'], buttonsVisible: 2 },
    moreRich: { buttons: ['insertLink', 'insertImage'], buttonsVisible: 0 },
    moreMisc: { buttons: ['undo', 'redo'], align: 'right', buttonsVisible: 2 },
  },
  toolbarSticky: true,
  toolbarInline: false,        // true = toolbar appears only when text is selected

  // Plugins: prefer a denylist over an allowlist
  pluginsDisabled: ['emoticons'],

  // Sizing
  heightMin: 200,
  heightMax: 600,

  theme: 'dark',               // also load css/themes/dark.min.css
  placeholderText: 'Start typing...',
};
```

- **Themes need their own stylesheet.** `dark`, `gray` and `royal` each require `froala-editor/css/themes/<theme>.min.css`.
- **Grouped toolbar:** with the object form (`moreText`, `moreParagraph`, `moreRich`, `moreMisc`), a button that is in no group is never rendered.
- **`pluginsEnabled` is an allowlist.** Setting it disables every plugin not listed — including your own custom plugins. Use `pluginsDisabled` to switch off a few plugins instead. Plugin names are in `references/plugin-names.md`.

---

## Licensing

The activation key is passed in the **`key`** option. `licenseKey` is not a Froala option and has no effect.

```js
key: import.meta.env.VITE_FROALA_KEY || 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE',    // Vite (React, Vue, Svelte)
key: process.env.NEXT_PUBLIC_FROALA_KEY || 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Next.js
```

- **Trial key** (from the [activation docs](https://froala.com/wysiwyg-editor/docs/activation/)): `TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE`. Every feature and plugin works. The editor shows "You are using a 30-day trial version of Froala Editor, which is not for production use." It never licenses a site, so don't use it in production.
- With a valid licence key the editor is clean on its domain and all its subdomains. Only a plain "Powered by Froala" text stays, which `attribution: false` turns off.

- Framework wrappers take `key` inside their config object (`config`, `[froalaEditor]` options…).
- An activation key is issued for a domain and also works on its subdomains.
- **Without a key, behaviour depends on the version.** On `localhost`, 5.5.0 shows only a small "Powered by Froala" badge under the editor. From 5.6.0, with no key or the trial key, localhost shows the same licence notice as a live site, and the console logs a warning. 5.6.0 also appends a `<p data-f-id="pbf">Powered by Froala Editor</p>` paragraph to the HTML that `html.get()` returns (observed with no key and with the trial key) — and therefore to the React `model`, which then changes right after load, and to anything you save. The paragraph is not visible in the editing area. Set your licence key before saving content you want to keep.
- The watermark is the `attribution` option. It can be turned off only with a valid key.
- Upgrading from an older major version to v5 needs a new key (see the migration guides).
- Never commit a production key to a public repository; read it from an environment variable.
- Details: the Activation section of the Froala docs (https://froala.com/wysiwyg-editor/docs/overview/) · Plans: https://cart.froala.com/

---

## Done means verified

Do not report the integration as finished until:

1. The project builds (and type-checks, if TypeScript) with no errors. For Angular, run the production `ng build`: it is the step that enforces the bundle budget.
2. If a browser tool is available: the page renders the toolbar, typing works, and the console has no errors. Otherwise ask the user to check these three things.
3. Every button listed in `toolbarButtons` is actually visible (a missing one means a missing plugin — see `references/plugin-names.md`).
4. The licence notice matches the key: with the trial key it reads "You are using a 30-day trial version of Froala Editor…". "The license key for Froala Editor is missing" or "…is invalid" means the key did not reach the editor.

---

## Common Mistakes

1. **Different versions in CDN URLs, or `@latest`** — pin one exact version everywhere.
2. **Missing CSS** — both base stylesheets are required, plus the theme CSS if `theme` is set.
3. **Plugin JS not loaded** — the button silently disappears. Use a `pkgd` bundle, or import one plugin per feature.
4. **Track Changes buttons missing** — `track_changes.min.js` is not in the `pkgd` bundles.
5. **Next.js / SvelteKit / Nuxt / Angular SSR failure (`Element is not defined`)** — load the editor in the browser only.
6. **Angular standalone + `forRoot()`** — import the modules directly in the component instead.
7. **Vue: wrong tag or `v-model`** — use `<froala>` and `v-model:value`.
8. **`pluginsEnabled` set to a short list** — everything else (including custom plugins) disappears. Prefer `pluginsDisabled`.
9. **Not destroying on unmount** in custom wrappers — call `editor.destroy()`.

---

## References

- `references/plugin-names.md` — plugin file → `pluginsEnabled` name → toolbar buttons (generated from the package)
- Getting started: https://froala.com/wysiwyg-editor/docs/overview/
- Framework integrations: https://froala.com/wysiwyg-editor/docs/framework-plugins/
- Options: https://froala.com/wysiwyg-editor/docs/options/
- Activation: see the Activation section of https://froala.com/wysiwyg-editor/docs/overview/
