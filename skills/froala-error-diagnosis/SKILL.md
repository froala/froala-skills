---
name: froala-error-diagnosis
description: >
  Use when the user encounters Froala errors or unexpected behavior. Activates on:
  symptom tokens (toolbar missing, button not showing, button not appearing, toolbar empty, no toolbar,
  plugin not loading, plugin not working, editor broken, editor not rendering, editor not showing),
  console error tokens (FroalaEditor is not defined, is not a constructor, html is undefined,
  image is undefined, Cannot read property, Cannot read properties of undefined, pluginsEnabled,
  No link in upload response, Parsing response failed),
  license tokens (license key is missing, license key is invalid, unlicensed banner, Powered by Froala notice),
  Next.js tokens (Element is not defined, next build fails, ssr false),
  version tokens (CDN mismatch, editor looks broken after update),
  API tokens (editor.text is undefined, froala-editor tag not rendering, Vue blank page, AI terms popup),
  or when user asks why a toolbar button, plugin, upload, or editor feature is not working.
version: 1.0.0
license: MIT
---

# Froala Error Diagnosis

Diagnose by symptom. Find the closest match below, check the cause, apply the fix.

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

// CORRECT — include every plugin you need
new FroalaEditor('#editor', {
  pluginsEnabled: ['link', 'image'],
  toolbarButtons: ['insertImage', 'insertLink'],
});
```

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

**Cause 5 — Custom command not registered when the toolbar is built.**
The toolbar skips any name that has no registered command (and any command whose plugin is not in `pluginsEnabled`). Call `FroalaEditor.RegisterCommand` (and `FroalaEditor.DefineIcon`) before `new FroalaEditor(...)`.

```js
FroalaEditor.DefineIcon('myBtn', { NAME: 'star', SVG_KEY: 'star' });
FroalaEditor.RegisterCommand('myBtn', { title: 'My button', callback() { /* ... */ } });
new FroalaEditor('#editor', { toolbarButtons: ['bold', 'myBtn'] });
```

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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/css/froala_editor.pkgd.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/css/froala_style.min.css">
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
  <script src="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/js/froala_editor.pkgd.min.js"></script>
</head>
<body>
  <script>new FroalaEditor('#editor', {});</script> <!-- may fail -->
</body>

<!-- CORRECT — place before </body> or use DOMContentLoaded -->
<body>
  <div id="editor"></div>
  <script src="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/js/froala_editor.pkgd.min.js"></script>
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

**Symptom:** Calling `editor.image.insert(...)`, `editor.html.get()` or similar throws `Cannot read properties of undefined (reading '...')`.

**Cause 1 — Called before `initialized`.**
The constructor returns immediately but builds the editor asynchronously, so modules such as `editor.html` and plugins such as `editor.image` do not exist yet. Call them only after the `initialized` event fires.

```js
// WRONG
const editor = new FroalaEditor('#editor', {});
editor.html.set('<p>Hello</p>'); // throws — editor.html is not created yet

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

**Cause 3 — The selector matched zero or several elements.**
`new FroalaEditor(selector)` returns a single instance only when exactly one element matches. With no match or several matches it returns an array, so `editor.html` is undefined. Use a unique selector or pass the DOM element itself.

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

## License Notice or Banner Appears

**Symptom (v5.6.0+):** A one-line notice under the editor, next to "Powered by Froala", such as "The license key for Froala Editor is missing…" or "…is invalid…" (amber dot), or "…expired…" (red dot). The same message is printed once per page in the console. Versions before 5.6.0 showed a red "unlicensed" banner instead.

**Cause — `key` not set, wrong for this domain, or expired.**
The activation option is `key`. Using `licenseKey` is a common mistake: it is not a Froala option, so it is ignored and the notice stays.
Since v5.6.0, `localhost` shows the same notice as a live site when there is no key or the trial key is used. For evaluation, use the public trial key `TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE` (never in production). A valid key covers its domain and subdomains; check it was generated for the domain you deploy to.

```js
new FroalaEditor('#editor', {
  key: process.env.FROALA_ACTIVATION_KEY, // never hardcode in public repos
});
```

With a valid key only a plain "Powered by Froala" text remains, which `attribution: false` hides. Get a key at [cart.froala.com](https://cart.froala.com/). See the [activation docs](https://froala.com/wysiwyg-editor/docs/activation/).

---

## Toolbar Button Renders but Does Nothing

**Symptom:** Button appears in the toolbar, is clickable, but has no effect.

**Cause 1 — Arrow function as the command `callback`.**
Froala calls `callback` with `this` set to the editor. An arrow function ignores that, so `this.html`, `this.selection`, etc. are wrong.

```js
// WRONG
FroalaEditor.RegisterCommand('myBtn', { callback: () => { this.html.insert('Hi'); } });

// CORRECT
FroalaEditor.RegisterCommand('myBtn', { callback() { this.html.insert('Hi'); } });
```

**Cause 2 — A `commands.before` handler returns `false`.**
Returning `false` from `commands.before` cancels the command. Return `false` only for the specific `cmd` you mean to block.

(A command that is not registered, or whose plugin is excluded by `pluginsEnabled`, is not rendered at all — see the toolbar section above.)

---

## Image / File Upload Does Nothing or Fails Silently

**Symptom:** Images end up as base64 in the HTML, the upload never completes, or the image popup shows "No link in upload response." / "Parsing response failed." / "Error during file upload."

**Cause 1 — `imageUploadURL` not set.**
`imageUploadURL` defaults to `null`, so Froala inserts images as base64 inline. For server upload, set the URL:

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

Any other shape fails the upload and fires `image.error` (code 2 = no link in response, 3 = server error, 4 = response could not be parsed). Log it, and check the Network tab for the actual response:

```js
events: {
  'image.error': function (error, response) {
    console.error(error.code, error.message, response);
  },
}
```

**Cause 3 — CORS.**
The upload endpoint must allow the origin making the request. Check browser console for CORS errors.

**Cause 4 — `image.beforeUpload` returns `false` unintentionally.**
If you intercept uploads and `return false` always (not just for custom upload paths), Froala cancels every upload.

---

## Reading Content: `html.get()` Fails or Is Stale

**Symptom:** `editor.html.get()` throws right after creating the editor, or your copy of the content is out of date.

**Cause — Read before the editor initializes, or read once instead of on change.**

```js
// WRONG — race condition
const editor = new FroalaEditor('#editor', {});
console.log(editor.html.get()); // throws — editor.html not created yet

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
// CORRECT — Editor.jsx (App Router: this file must itself be 'use client',
// because ssr: false is not allowed in Server Components)
'use client';
import dynamic from 'next/dynamic';
const FroalaClient = dynamic(() => import('./FroalaClient'), { ssr: false });
export default function Editor() { return <FroalaClient />; }
```

`FroalaClient.jsx` holds the Froala imports and `<FroalaEditorComponent>`. Pages import `Editor`, never `FroalaClient` directly, or the server-rendering failure comes back.

---

## Editor Looks Broken After a CDN Update

**Symptom:** The editor worked, then broke with no code change.

**Cause — unpinned URLs, so files come from different versions.** An unversioned jsDelivr URL (`froala-editor/...` or `@latest`) follows the newest release, and each file is cached separately, so after a release the core JS, CSS and plugin files can briefly come from different versions. Core, plugins and CSS must all be the same version With npm, install `froala-editor` at the exact version your wrapper depends on (`react-froala-wysiwyg` and `vue-froala-wysiwyg` 5.6.0 pin `froala-editor` 5.6.0); otherwise npm can install a second copy, and plugins you import register on a different copy than the one the wrapper uses.

```html
<!-- Pin the same version in every URL -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/css/froala_editor.pkgd.min.css">
<script src="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/js/froala_editor.pkgd.min.js"></script>
```

---

## `editor.text is undefined`

**Symptom:** `editor.text.get()` throws.

**Cause — there is no `text` API.** Use `editor.html.get()` for the content, or `editor.selection.text()` for the selected text.

---

## Vue Component Not Rendering

**Symptom:** Nothing appears where the editor should be; no error.

**Cause 1 — wrong tag.** `app.use(VueFroala)` registers the component as `<froala>`, not `<froala-editor>`.

```vue
<froala :tag="'textarea'" :config="config" v-model:value="content"></froala>
```

Use `v-model:value`, not plain `v-model`: the component doesn't read or update `modelValue`.

**Cause 2 — the plugin was not actually registered (Vite 8 / `"type": "module"`).** A plain `import VueFroala from 'vue-froala-wysiwyg'` can return the module namespace instead of the plugin. Dev shows `A plugin must either be a function or an object with an "install" function.`; production just renders a blank page. Import it this way:

```js
import * as VueFroalaModule from 'vue-froala-wysiwyg';
const VueFroala = VueFroalaModule.default?.default ?? VueFroalaModule.default;
app.use(VueFroala);
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

If you set `pluginsEnabled`, its plugin name is `track_changes`.

The same applies to `edit_in_popup`, `trim_video` (plus `css/plugins/trim_video.min.css`), and the `js/third_party/` plugins (`embedly`, `font_awesome`, `image_tui`, `imageFileRobot`, `spell_checker`), which also need their `css/third_party/<name>.min.css`.

---

## Quick Diagnosis Checklist

If something isn't working and you're not sure where to start:

1. **Open browser DevTools → Console** — look for any JS errors
2. **Open Network tab** — check for failed requests (uploads, plugin/CSS files returning 404)
3. **Confirm plugin JS is imported** for every feature you're using
4. **Confirm CSS is imported** if the editor looks wrong
5. **Confirm `pluginsEnabled` includes** every plugin you need (or remove it entirely)
6. **Wrap post-init calls** in the `initialized` event
7. **Use `function()` not `() =>`** for all Froala event handlers
8. **Pin the same version** in every CDN URL
9. **Next.js:** load the editor with `ssr: false`
