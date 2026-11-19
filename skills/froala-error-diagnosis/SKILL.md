---
name: froala-error-diagnosis
description: >
  Use when a Froala editor is broken, throws, looks wrong, or a feature silently does nothing — even if
  the user only describes the symptom. Activates on toolbar missing, button not showing, button does
  nothing, plugin not loading, editor not rendering, blank page, unstyled editor, FroalaEditor is not
  defined, is not a constructor, Cannot read properties of undefined, editor.image is undefined,
  Element is not defined, document is not defined, Element type is invalid, NG2012, TS7016, bundle initial
  exceeded maximum budget, rules skipped due to selector errors, Angular CLI requires a minimum Node.js version,
  A plugin must either be a function or an object with an install function, Failed to resolve component: froala, images disappear after reload, upload
  fails, licence or unlicensed banner, AI terms popup, Word import or export does nothing, or editor broke
  after an update. NOT for first-time setup (froala-initialization-and-sdks).
license: MIT
metadata:
  version: "1.1.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-18"
---

# Froala Error Diagnosis

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. A project that still calls `.froalaEditor()` on a jQuery object runs Froala 2: upgrading means switching to `new FroalaEditor(...)`. Names that start with `$` in the current API (`editor.$el`, the `$btn` passed to `refresh`, the `$popup` from `editor.popups.create`) are Froala's own DOM helpers, not jQuery: keep using them where the API hands them to you.

Diagnose by symptom. Find the closest match below, check the cause, apply the fix.

**First, collect three facts:**

1. The installed version: `node_modules/froala-editor/package.json` (wrapper versions should match).
2. The browser console output, captured **from page load** (many Froala errors happen during init).
3. How Froala is loaded: CDN, `pkgd` bundle, or single plugin files.

In CDN URLs below, replace `VERSION` with the installed version.

---

## Toolbar Button Is Missing or Not Showing

**Symptom:** You added a button name to `toolbarButtons` but it doesn't appear.

**Cause 1 — Plugin JS not imported.**
Toolbar buttons backed by a plugin (image, link, table, video, etc.) require the plugin's JS file to be imported first.

```js
// WRONG — button silently absent
new FroalaEditor('#editor', {
  toolbarButtons: ['insertImage'],
});

// CORRECT
import 'froala-editor/js/plugins/image.min.js';

new FroalaEditor('#editor', {
  toolbarButtons: ['insertImage'],
});
```

**Cause 2 — `pluginsEnabled` excludes the plugin.**
If `pluginsEnabled` is set, it acts as an allowlist — any plugin not listed is disabled even if imported.

```js
// WRONG — image plugin disabled
new FroalaEditor('#editor', {
  pluginsEnabled: ['link'],
  toolbarButtons: ['insertImage'], // silently gone
});

// CORRECT — include every plugin you need (names, not file names)
new FroalaEditor('#editor', {
  pluginsEnabled: ['link', 'image'],
  toolbarButtons: ['insertImage', 'insertLink'],
});

// OFTEN BETTER — keep everything except what you don't want
new FroalaEditor('#editor', {
  pluginsDisabled: ['emoticons'],
});
```

`pluginsEnabled` uses plugin names such as `importFromWord`, `aiAssist`, `track_changes` — not file names (`import_from_word.min.js`) and not button names (`import_from_word`). See `references/plugin-names.md`.

**Cause 3 — Wrong button name.**
Button names are case-sensitive and version-specific. Common correct names:

| Feature | Correct button name |
|---------|-------------------|
| Bold | `bold` |
| Italic | `italic` |
| Insert image | `insertImage` |
| Insert link | `insertLink` |
| Insert table | `insertTable` |
| Ordered list | `formatOL` |
| Unordered list | `formatUL` |
| Align left | `alignLeft` |
| Font size | `fontSize` |
| Text color | `textColor` |
| Clear formatting | `clearFormatting` |
| Full screen | `fullscreen` |
| HTML view | `html` |

**Cause 4 — Button missing from the toolbar group object (v4+).**
In Froala v4+, `toolbarButtons` can be a grouped object. Omitting a group means those buttons are never rendered.

```js
// WRONG — insertImage not in any group
toolbarButtons: {
  moreText: { buttons: ['bold', 'italic'] },
  // no moreRich group = insertImage never appears
}

// CORRECT
toolbarButtons: {
  moreText: { buttons: ['bold', 'italic'] },
  moreRich: { buttons: ['insertImage', 'insertLink', 'insertTable'] },
}
```

**Cause 5 — Custom command registered after the editor started.**
`FroalaEditor.RegisterCommand(...)` must run before `new FroalaEditor(...)`; the toolbar is built once, at start.

**Cause 6 — Plugin not in any `pkgd` bundle.** Check the "In pkgd" columns of `references/plugin-names.md`; for example `track_changes` and the `third_party` plugins must be loaded separately. Plugin names are in `references/plugin-names.md`.

---

## Editor Renders but Looks Broken or Unstyled

**Symptom:** The editor mounts but has no borders, wrong fonts, or collapsed layout.

**Cause — Missing CSS imports.**
Froala requires two stylesheets: one for the editor chrome, one for the content area.

```js
// Both are required
import 'froala-editor/css/froala_editor.pkgd.min.css'; // editor UI
import 'froala-editor/css/froala_style.min.css';       // content styling
```

For CDN:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_editor.pkgd.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_style.min.css">
```

**If `theme` is set, its stylesheet is also required.** `dark`, `gray` and `royal` each need `froala-editor/css/themes/<name>.min.css`. Setting `theme: 'dark'` without loading `themes/dark.min.css` leaves the editor unstyled.

---

## "FroalaEditor is not defined" / "is not a constructor"

**Symptom:** Console error when calling `new FroalaEditor(...)`.

**Cause 1 — Script not loaded yet (CDN).**
The script tag is in `<head>` without `defer`, or the inline script runs before the CDN script.

```html
<!-- WRONG — script may not be loaded when inline JS runs -->
<head>
  <script src="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/js/froala_editor.pkgd.min.js"></script>
</head>
<body>
  <script>new FroalaEditor('#editor', {});</script> <!-- may fail -->
</body>

<!-- CORRECT — place before </body> or use DOMContentLoaded -->
<body>
  <div id="editor"></div>
  <script src="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/js/froala_editor.pkgd.min.js"></script>
  <script>new FroalaEditor('#editor', {});</script>
</body>
```

**Cause 2 — Wrong import in a bundler.**

```js
// WRONG
import { FroalaEditor } from 'froala-editor'; // named export doesn't exist

// CORRECT
import FroalaEditor from 'froala-editor';
```

---

## Plugin Method Is Undefined (`editor.image is undefined`, etc.)

**Symptom:** Calling `editor.image.insert(...)` or similar throws `Cannot read property of undefined`.

**Cause 1 — Called before `initialized`.**
The editor instance is not safe to call until the `initialized` event fires.

```js
// WRONG
const editor = new FroalaEditor('#editor', {});
editor.html.set('<p>Hello</p>'); // error — editor not ready

// CORRECT
new FroalaEditor('#editor', {
  events: {
    initialized() {
      this.html.set('<p>Hello</p>'); // safe
    },
  },
});
```

**Cause 2 — Plugin JS not imported.**
`editor.image`, `editor.link`, `editor.table`, etc. only exist if the corresponding plugin is imported.

```js
import 'froala-editor/js/plugins/image.min.js'; // required for editor.image.*
import 'froala-editor/js/plugins/link.min.js';  // required for editor.link.*
```

---

## Editor Does Not Mount / Element Not Found

**Symptom:** No editor appears; no console error or a silent failure.

**Cause 1 — Selector doesn't match any element.**
`new FroalaEditor('#editor')` silently does nothing if `#editor` doesn't exist.

```js
// Verify the element exists before init
const el = document.querySelector('#editor');
if (!el) console.error('Froala target element not found');
new FroalaEditor('#editor', {});
```

**Cause 2 — DOM not ready.**

```js
// WRONG — runs before DOM is parsed
new FroalaEditor('#editor', {}); // element doesn't exist yet

// CORRECT
document.addEventListener('DOMContentLoaded', () => {
  new FroalaEditor('#editor', {});
});
```

---

## Licence Notice or Banner Appears

**Symptom:** a licence notice appears under the editor or in the console. Up to 5.5.0 it is a red banner: "This is an unlicensed version of the Froala Editor. To use it legally, please obtain a valid license…". 5.6.0 replaced it with a short notice next to "Powered by Froala":

| Notice (5.6.0) | Meaning | Fix |
|---|---|---|
| The license key for Froala Editor is missing. | No key, or an empty key | Add the trial key `TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE` to evaluate, or your licence key |
| You are using a 30-day trial version of Froala Editor, which is not for production use. | The trial key is in use | Expected while evaluating. Set a licence key before production |
| The license key for Froala Editor is invalid. | Key issued for another domain, copied incorrectly, or a bad date | Check the whole key was copied and was issued for this domain |
| The license key for Froala Editor expired. | A term key more than 15 days past expiry, or a perpetual key older than this release | Renew, or contact Froala sales |

**Cause 1 — the option name is wrong.** The activation key goes in the `key` option. `licenseKey` is not a Froala option and has no effect.

**Cause 2 — the key is missing in the deployed build.** Environment variables are often set locally but not in the production build. Check that the variable is defined at build time (never log the key itself).

**Cause 3 — the key does not cover this domain.** A key is issued for a domain and its subdomains. Check the domains of the licence, and remember that upgrading from an older major version to v5 needs a new key.

**Cause 4 — no key or the trial key during local development on 5.6.0+.** On `localhost`, 5.5.0 shows only a small "Powered by Froala" badge without a key. From 5.6.0, localhost shows the same notice as a live site and the console logs it too. With no key or the trial key, 5.6.0 also appends `<p data-f-id="pbf">Powered by Froala Editor</p>` to the HTML that `html.get()` returns (and to the React `model`). That paragraph is saved with the content and shown wherever the saved HTML is displayed. Set a licence key. `html.set()` removes the paragraph when content is loaded back into the editor, so opening and re-saving each affected document cleans it.

```js
new FroalaEditor('#editor', {
  key: process.env.FROALA_ACTIVATION_KEY, // never hardcode in public repos
});
```

Activation docs: https://froala.com/wysiwyg-editor/docs/activation/

---

## Toolbar Button Renders but Does Nothing

**Symptom:** the button is visible and clickable but has no effect.

**Cause 1 — the command's plugin never started.** The command was registered in time, but `FroalaEditor.PLUGINS.myPlugin` was defined after `new FroalaEditor(...)`, or `pluginsEnabled` does not list it. The callback then throws on `this.myPlugin.…` — check the console.

```js
// CORRECT — plugin and command both registered before the editor starts
FroalaEditor.PLUGINS.myPlugin = function (editor) { /* … */ return { _init() {} }; };
FroalaEditor.RegisterCommand('myBtn', { plugin: 'myPlugin', callback() { this.myPlugin.run(); } });
const editor = new FroalaEditor('#editor', { toolbarButtons: ['myBtn'] });
```

**Cause 2 — the callback is an arrow function.** `this` is not the editor. Use `callback() { … }`.

**Cause 3 — the callback throws.** Read the console; the error is usually logged on click.

**Cause 4 — AI buttons:** see "AI Buttons Only Show a Terms Popup" below.

---

## Image / File Upload Does Nothing or Fails Silently

**Symptom:** Selecting a file does nothing, or upload seems to start but never completes.

**Cause 1 — `imageUploadURL` not set.**
Without `imageUploadURL`, `imageUploadToS3` or `imageUploadToAzure`, Froala does not upload anything. It inserts the image as a temporary `blob:` URL (SVG files as a data URI). **Blob URLs only work in the current browser tab**, so saved content shows broken images after a reload or on another device. Set an upload URL for anything that is saved:

```js
new FroalaEditor('#editor', {
  imageUploadURL: '/api/upload/image',
  fileUploadURL: '/api/upload/file',
});
```

**Cause 2 — Server response format wrong.**
Froala expects a specific JSON shape:

```json
{ "link": "https://your-cdn.com/uploaded-image.jpg" }
```

Any other shape causes a silent failure. Check the Network tab for the actual response.

**Cause 3 — CORS.**
The upload endpoint must allow the origin making the request. Check browser console for CORS errors.

**Cause 4 — `image.beforeUpload` returns `false` unintentionally.**
If you intercept uploads and `return false` always (not just for custom upload paths), Froala cancels every upload.

---

## `html.get()` Returns Empty String

**Symptom:** `editor.html.get()` returns `""` even though the editor has content.

**Cause — Called before the editor initializes or outside the editor's context.**

```js
// WRONG — race condition
const editor = new FroalaEditor('#editor', {});
console.log(editor.html.get()); // "" — not ready yet

// CORRECT
new FroalaEditor('#editor', {
  events: {
    contentChanged() {
      console.log(this.html.get()); // always safe here
    },
  },
});
```

For React, use `onModelChange` instead:

```jsx
<FroalaEditorComponent onModelChange={(html) => setContent(html)} />
```

---

## `this` Is Undefined or Wrong in Event Handlers

**Symptom:** Inside a Froala event callback, `this` is `undefined`, `window`, or a React component instead of the editor instance.

**Cause — Arrow function used as event handler.**
Arrow functions inherit `this` from their surrounding scope. Froala sets `this` to the editor instance using `.call()`, which arrow functions ignore.

```js
// WRONG — `this` is not the editor
events: {
  contentChanged: () => {
    console.log(this.html.get()); // `this` is wrong
  },
}

// CORRECT — `this` is the editor instance
events: {
  contentChanged() {
    console.log(this.html.get()); // correct
  },
}
```

---

## Next.js Build Fails: `ReferenceError: Element is not defined`

**Symptom:** `next build` fails, or the page errors during server rendering.

**Cause — Froala imported during server rendering.** Froala needs the browser DOM. Adding `'use client'` is **not** enough, because client components are still pre-rendered on the server.

```jsx
// CORRECT — skip server rendering entirely
import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('../components/Editor'), { ssr: false });
```

---

## Editor Looks Broken After a CDN Update

**Symptom:** The editor worked, then broke with no code change.

**Cause — CSS and JS versions differ.** Unversioned jsDelivr URLs can serve cached older files independently, so the CSS and JS drift apart.

```html
<!-- Pin the same version in every URL -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_editor.pkgd.min.css">
<script src="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/js/froala_editor.pkgd.min.js"></script>
```

---

## `editor.text is undefined`

**Symptom:** `editor.text.get()` throws.

**Cause — there is no `text` API.** Use `editor.html.get()` for the content, or `editor.selection.text()` for the selected text.

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

---

## AI Buttons Only Show a "Terms" Popup

**Symptom:** Clicking an AI Assist button opens a popup asking you to accept the AI Supplemental Terms, and nothing else happens.

**Cause — `aiSupplementalTermsAccepted` not set.**

```js
new FroalaEditor('#editor', {
  aiSupplementalTermsAccepted: true,
});
```

---

## Track Changes Buttons Missing

**Symptom:** `trackChanges`, `showChanges`, `applyAll` or `removeAll` are in `toolbarButtons` but never render.

**Cause — `track_changes.min.js` is not in the `pkgd` bundles.** Load it separately.

```js
import 'froala-editor/js/plugins/track_changes.min.js';
```

The same applies to every file marked "no" in `references/plugin-names.md`, including the `third_party` plugins (`embedly`, `font_awesome`, `image_tui`, `imageFileRobot`, `spell_checker`).

---

## Images Disappear After Saving or Reloading

**Symptom:** images look fine while editing, but are broken after the content is saved and loaded again. The saved HTML contains `src="blob:…"`.

**Cause:** no upload is configured, so images were only kept as temporary blob URLs (Froala's FAQ: by default images are stored temporarily as a Blob in browser memory). Set `imageUploadURL` (or S3/Azure/Filestack) — see the upload section above. Existing content with `blob:` URLs cannot be recovered; the images must be uploaded again.

---

## Angular: NG2012 / TS2322 With `forRoot()`

**Symptom:** a standalone component fails to compile with NG2012: "Component imports contains a ModuleWithProviders value, likely the result of a 'Module.forRoot()'-style call…".

**Fix:** in standalone components, import the modules directly: `imports: [FroalaEditorModule, FroalaViewModule]`. Use `forRoot()` only in an `@NgModule`.

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

---

## Word Import or Export Does Nothing

| Symptom | Cause | Fix |
|---|---|---|
| Import does nothing | mammoth.js missing, or loaded **after** the Froala plugin (the plugin reads `window.mammoth` when it loads) | Load mammoth first, or pass it: `importFromWordMammoth: mammoth` |
| Export shows an error popup | `window.htmlDocx` or `window.saveAs` missing when Export is clicked | Load `html-docx-js` and a FileSaver build that defines `window.saveAs`, or assign both globals |
| Exported file will not open in LibreOffice / Google Docs | `html-docx-js` output targets Microsoft Word | Convert on the server if other apps must open it |

---

## PDF Button Does Nothing

**Symptom:** the PDF button (`getPDF`, print plugin) is visible, but clicking it downloads nothing and shows no error.

**Cause:** the PDF export needs html2pdf.js. The print plugin reads `window.html2pdf` when the plugin loads (option `html2pdf`), and does nothing if it is missing.

**Fix:** load html2pdf.js **before** the Froala scripts, or pass the library as the `html2pdf` option. Verify by clicking the button and opening the downloaded PDF.

---

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

## Bugs Fixed by Upgrading to 5.6.0

If the project uses 5.5.0 or older and the symptom is listed here, upgrade `froala-editor` and the framework wrapper together (from Froala's 5.6.0 release notes):

| Symptom on 5.5.0 or older | Area |
|---|---|
| Vite 8 React app shows a blank page or "Element type is invalid" | React (see the section above) |
| StrictMode runs `initialized` three times; `onModelChange` fires when the editor loads | React |
| `ref.current.initialize()` / `ref.current.destroy()` throw | React |
| Passing the editor's own value back into `model` clears the undo history | React |
| After `FormControl.reset()`, the first edit does not update the form value | Angular Reactive Forms |
| Image, link and table popups open behind Angular Material v21 dialogs | Angular |
| Clear Formatting removes comments from the selected text | Collaboration |
| Formatting newly typed text loses its tracked insertion; Undo in Suggestion mode clears content | Track Changes |
| Potential XSS in Word export | Word Export (security) |
| Custom font size applies only in the first editor on the page | Several editors on one page |

---

## Quick Diagnosis Checklist

If something isn't working and you're not sure where to start:

1. **Open browser DevTools → Console** — look for any JS errors
2. **Open Network tab** — check for failed requests (uploads, license checks)
3. **Confirm plugin JS is imported** for every feature you're using
4. **Confirm CSS is imported** if the editor looks wrong
5. **Confirm `pluginsEnabled` includes** every plugin you need (or remove it entirely)
6. **Wrap post-init calls** in the `initialized` event
7. **Use `function()` not `() =>`** for all Froala event handlers
8. **Pin the same version** in every CDN URL
9. **SSR frameworks:** load the editor in the browser only
10. **Saved HTML contains `blob:` URLs?** Configure an upload target
11. **Saved HTML contains `data-f-id="pbf"` ("Powered by Froala Editor")?** Set the `key` option (5.6.0+)
12. **React: content inserted from code missing from `model`?** Call `editor.undo.saveStep()` after the change
13. **Still stuck?** Compare the installed version with `metadata.verified_against` of this skill and check the [changelog](https://www.froala.com/wysiwyg-editor/changelog) for changed options
