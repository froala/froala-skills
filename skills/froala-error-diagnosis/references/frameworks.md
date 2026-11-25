# Framework, SSR, build and TypeScript errors

Part of the froala-error-diagnosis skill (verified against froala-editor 5.6.0). Start from the symptom index in that skill's SKILL.md. In CDN URLs, replace `VERSION` with the installed version.

## Contents

- React: `Element type is invalid … but got: object`
- React: Content Inserted From Code Is Missing From `model` or the Saved HTML
- Next.js Build Fails: `ReferenceError: Element is not defined`
- SSR: `ReferenceError: Element is not defined` / `document is not defined`
- Vue Component Not Rendering
- Angular: NG2012 / TS2322 With `forRoot()`
- Angular Build Fails: "bundle initial exceeded maximum budget"
- Angular CLI: "requires a minimum Node.js version"
- TypeScript: TS7016 "Could not find a declaration file"
- TypeScript: TS2300 "Duplicate identifier 'LineHeight'"

## React: `Element type is invalid … but got: object`

**Symptom:** a React app built with **Vite 8** crashes on the first render with `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: object`.

**Cause:** with `react-froala-wysiwyg` 5.5.0 or older, Vite 8 resolves `import FroalaEditorComponent from 'react-froala-wysiwyg'` to `{ default: … }`. Vite 7 resolves it to the component. 5.6.0 fixes the package.

**Fix:** upgrade `froala-editor` and `react-froala-wysiwyg` together to 5.6.0+, or unwrap the import (same for `react-froala-wysiwyg/FroalaEditorView`):

```jsx
import FroalaEditorImport from 'react-froala-wysiwyg';
const FroalaEditorComponent = FroalaEditorImport.default ?? FroalaEditorImport;
```

---

## React: Content Inserted From Code Is Missing From `model` or the Saved HTML

**Symptom:** a button calls `getEditor().html.insert(…)` (or `html.set(…)`). The text appears in the editor, but `model` / `onModelChange` does not include it, and saving loses it — until the user types again.

**Cause:** `html.insert()` and `html.set()` do not fire `contentChanged`, and the wrapper updates `model` only on `contentChanged`.

**Fix:** call `editor.undo.saveStep()` right after the change. It adds an undo step and fires `contentChanged`. See froala-methods-and-events.

---

## Next.js Build Fails: `ReferenceError: Element is not defined`

**Symptom:** `next build` fails, or the page errors during server rendering.

**Cause — Froala imported during server rendering.** Froala needs the browser DOM. Adding `'use client'` is **not** enough, because client components are still pre-rendered on the server.

```jsx
// Editor.jsx — App Router: this file must itself be a client component,
// because `ssr: false` is not allowed in Server Components
'use client';
import dynamic from 'next/dynamic';
export default dynamic(() => import('./EditorClient'), { ssr: false });
```

`EditorClient.jsx` holds the Froala imports and `<FroalaEditorComponent>` (see froala-initialization-and-sdks). Pages import `Editor`, never `EditorClient` directly, or the server-rendering failure comes back.

---

## SSR: `ReferenceError: Element is not defined` / `document is not defined`

**Symptom:** the build or server render fails in Next.js, Nuxt, SvelteKit or Angular SSR. Angular reports it while prerendering: "An error occurred while extracting routes. ReferenceError: document is not defined".

**Cause:** Froala uses browser APIs as soon as it is imported; importing `froala-editor` (directly, or through a framework wrapper) on a server throws `ReferenceError: Element is not defined` or `document is not defined`. Load it in the browser only:

| Framework | Fix |
|---|---|
| Next.js | `dynamic(() => import('./EditorClient'), { ssr: false })` — `'use client'` alone is not enough |
| Nuxt | client-only plugin (`plugins/froala.client.ts`) and `<ClientOnly>` |
| SvelteKit | `export const ssr = false;` in the route's `+page.js` |
| Angular SSR | Show the editor component inside `@defer (on idle) { … } @placeholder { … }`: the server renders the placeholder and never loads Froala |

---

## Vue Component Not Rendering

**Symptom:** Nothing appears where the editor should be; no error.

**Cause 1 — Vite 8 default import (`vue-froala-wysiwyg` 5.6.0).** In dev the console shows the Vue warnings "A plugin must either be a function or an object with an 'install' function" and "Failed to resolve component: froala"; a production build shows only a blank space. Vite 8 resolves `import VueFroala from 'vue-froala-wysiwyg'` to the module wrapper instead of the plugin. Import it as the wrapper's README does:

```js
import * as VueFroalaModule from 'vue-froala-wysiwyg';
const VueFroala = VueFroalaModule.default?.default ?? VueFroalaModule.default;
createApp(App).use(VueFroala).mount('#app');
```

**Cause 2 — wrong tag.** `app.use(VueFroala)` registers the component as `<froala>`, not `<froala-editor>`.

```vue
<froala :tag="'textarea'" :config="config" v-model:value="content"></froala>
```

**Cause 3 — the editor shows, but your variable never updates.** Use `v-model:value`, not plain `v-model`: the component only emits `update:value`.

---

## Angular: NG2012 / TS2322 With `forRoot()`

**Symptom:** a standalone component fails to compile with NG2012: "Component imports contains a ModuleWithProviders value, likely the result of a 'Module.forRoot()'-style call…".

**Fix:** in standalone components, import the modules directly: `imports: [FroalaEditorModule, FroalaViewModule]`. Use `forRoot()` only in an `@NgModule`.

---

## Angular Build Fails: "bundle initial exceeded maximum budget"

**Symptom:** `ng build` in a new Angular project fails with "bundle initial exceeded maximum budget. Budget 1.00 MB was not met by …" after adding Froala.

**Cause:** Froala and its plugins are about 2 MB minified. New projects fail the build when the initial bundle is over 1 MB.

**Fix:** show the editor component inside `@defer (on idle) { <app-editor /> } @placeholder { … }` in the parent template. Froala moves into a lazy chunk and the initial bundle drops to about 0.5 MB. Froala's global stylesheet can still exceed the 500 kB *warning* budget; that is a warning, not an error.

`TS2345: Argument of type 'Object' is not assignable to parameter of type …` on `(froalaInit)="onInit($event)"`: the wrapper types the payload as `Object`. Declare the handler parameter as `any`. Also note that binding `(froalaInit)` means the editor starts only after you call `controls.initialize()`.

Two more messages in Angular builds are harmless: "2 rules skipped due to selector errors: 0% -> Unmatched selector: %" (old `@-moz-keyframes` / `@-o-keyframes` blocks in Froala's CSS that Angular's critical-CSS step can't read) and, in `ng serve`, NG0751 about `@defer` loading eagerly with hot module replacement. "Module 'froala-editor' … is not ESM" warnings go away with `"allowedCommonJsDependencies": ["froala-editor"]` in `angular.json`.

---

## Angular CLI: "requires a minimum Node.js version"

**Symptom:** `ng new` or `ng serve` stops with "The Angular CLI requires a minimum Node.js version of …".

**Fix:** each Angular CLI major supports a Node.js range (CLI 22: `^22.22.3`, `^24.15.0` or 26+; CLI 21: `^20.19.0`, `^22.12.0` or 24+). Ask the user whether to update Node.js, or use the newest CLI that supports the installed version, for example `npx @angular/cli@21 new my-app`. Froala's Angular wrapper supports Angular 19+.

---

## TypeScript: TS7016 "Could not find a declaration file"

**Cause:** `froala-editor` ships declarations for the core only, and `vue-froala-wysiwyg` and `svelte-froala-wysiwyg` ship none. Add a `.d.ts` file:

```ts
declare module 'vue-froala-wysiwyg';
declare module 'froala-editor/js/plugins/*';
declare module 'froala-editor/js/plugins.pkgd.min.js';
```

Where the types are: `froala-editor` declares `"types": "index.d.ts"` in its `package.json` (in the package root). The plugin files have no module declarations of their own. In 5.6.0, a side-effect import such as `import 'froala-editor/js/plugins/image.min.js'` compiles without a declaration; a dynamic `import('froala-editor/js/plugins.pkgd.min.js')` fails with TS7016 until the `declare module` line above is added (open issue #5010, see `known-issues.md`).

---

## TypeScript: TS2300 "Duplicate identifier 'LineHeight'"

**Symptom:** `tsc` reports `node_modules/froala-editor/index.d.ts: error TS2300: Duplicate identifier 'LineHeight'` twice.

**Cause:** froala-editor **4.5.0** declares both `type LineHeight` and `interface LineHeight` in `index.d.ts` (GitHub issue #4879, still open). From 4.5.1 the type is named `LineHeightObj`, and `tsc` compiles cleanly against 4.5.1, 4.5.2 and 5.6.0.

**Fix:** upgrade `froala-editor` (and the wrapper) to 4.5.1 or later. If the project must stay on 4.5.0, `"skipLibCheck": true` in `tsconfig.json` hides the error (checked with `tsc`).
