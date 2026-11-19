# Framework wrapper changes

Sources: npm metadata (`npm view <wrapper>@<version> dependencies peerDependencies`) and the READMEs of `react-froala-wysiwyg`, `vue-froala-wysiwyg` and `angular-froala-wysiwyg` 2.9.8, 3.2.7, 4.0.19, 4.1.0 and 5.6.0, `svelte-froala-wysiwyg` 5.3.0 – 5.6.0, and the [changelog](https://froala.com/wysiwyg-editor/changelog/).

Wrapper versions follow `froala-editor` versions. Upgrade the wrapper and `froala-editor` to the **same** version in one install.

## How each wrapper depends on the core

| Wrapper | `froala-editor` dependency | Update command (from the wrapper README) |
|---|---|---|
| `react-froala-wysiwyg` | exact version (2.9.8 → 5.6.0) | `npm install --save-exact react-froala-wysiwyg@latest froala-editor@$(npm view react-froala-wysiwyg@latest dependencies.froala-editor)` |
| `angular-froala-wysiwyg` | exact version (2.9.8 → 5.6.0) | `npm install angular-froala-wysiwyg@latest` (then align `froala-editor` if the project lists it) |
| `vue-froala-wysiwyg` | range `^X.Y.Z` up to 5.0.1; exact from 5.1.0 | `npm install vue-froala-wysiwyg@latest` (then align `froala-editor`) |
| `svelte-froala-wysiwyg` | range `^X.Y.Z` (5.3.0 – 5.6.0) | install the wrapper and `froala-editor` at the same version |

With a range (older Vue wrappers, Svelte), a fresh install can resolve a newer `froala-editor` than the wrapper. Pin both to the same exact version in `package.json`, and check `npm ls froala-editor` shows one copy.

## React (`react-froala-wysiwyg`)

| Version | Change |
|---|---|
| 2.x | Needs jQuery: `window.$ = $` (create-react-app) or webpack `ProvidePlugin({ $: 'jquery', jQuery: 'jquery' })`; imports `font-awesome`; events written as `'froalaEditor.focus': function (e, editor) {…}` |
| 3.x | jQuery and Font Awesome no longer needed (remove the `ProvidePlugin` / `window.$` code). Events use plain names (`focus`). Plugins are imported separately (`froala-editor/js/plugins.pkgd.min.js` or single files) |
| 4.5.0 | `create-react-class` dependency no longer listed (still present in 4.1.0) |
| 4.6.0 | React 19 added to the peer dependencies (React 0.14 – 19); depends on `serialize-javascript` |
| 5.6.0 | `serialize-javascript` `^7.0.3`. Behaviour: `initialized` runs once per editor under StrictMode (twice in development is the StrictMode remount, not a bug); `onModelChange` no longer fires on load; passing the editor's value back into `model` keeps undo history; props and options are type-checked; `initialize()` / `destroy()` work on a ref; Vite 8 default import fixed |

Before 5.6.0, under Vite 8 the default import resolves to `{ default: … }` and React throws "Element type is invalid" (see froala-error-diagnosis). Upgrading to 5.6.0 fixes it.

## Vue (`vue-froala-wysiwyg`)

| Version | Change |
|---|---|
| 2.9.8 – 4.0.19 | **Vue 2** (`dependencies.vue` `2.6.6`); registered with `Vue.use(VueFroala)` and `new Vue({...})` |
| 3.x | Events use plain names (`initialized`, `focus`) instead of `'froalaEditor.initialized'` |
| **4.1.0** | **Vue 3** (`dependencies.vue` `^3.2.0`); registered with `createApp(App)` then `app.use(VueFroala)` |
| 5.1.0 | Exact `froala-editor` pin |
| 5.6.0 README | Under Vite 8 import the plugin the way the README's entry file does (a plain default import leaves a blank page); bind content with `v-model:value`, not `v-model` |

A Vue 2 app can't go past `vue-froala-wysiwyg` 4.0.19. Upgrade the app to Vue 3 first, or keep the editor on 4.0.x — and know that its `^4.0.19` range lets npm install a later 4.x `froala-editor`; pin `froala-editor` to `4.0.19` in that case.

## Angular (`angular-froala-wysiwyg`)

| Version | Change |
|---|---|
| 2.9.8 | Depends on `@types/jquery`; events `'froalaEditor.focus': function (e, editor) {…}` |
| 3.x + | No jQuery. Module API unchanged: `FroalaEditorModule.forRoot()`, `FroalaViewModule.forRoot()` (5.6.0 also exports `FERootModule` as a shortcut) |
| 5.6.0 | README: "Angular 19+ bindings"; package ships `fesm2022` builds. Fixes: Reactive Forms reset, popups above Angular Material v21 dialogs |

Check the project's Angular version before choosing the target: the 5.6.0 wrapper targets Angular 19+. Standalone setup, SSR and bundle-budget notes are in froala-initialization-and-sdks.

## Svelte (`svelte-froala-wysiwyg`)

First released with Froala 5.3.0. Peer/dependency on `svelte` `^5.0.0`. Nothing to migrate from older majors.
