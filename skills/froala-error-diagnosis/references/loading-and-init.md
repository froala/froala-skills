# Loading, styling and initialization errors

Part of the froala-error-diagnosis skill (verified against froala-editor 5.6.0). Start from the symptom index in that skill's SKILL.md. In CDN URLs, replace `VERSION` with the installed version.

## Contents

- Editor Renders but Looks Broken or Unstyled
- "FroalaEditor is not defined" / "is not a constructor"
- Plugin Method Is Undefined (`editor.image is undefined`, etc.)
- Editor Does Not Mount / Element Not Found
- `html.get()` Throws or Returns Stale Content
- `this` Is Undefined or Wrong in Event Handlers
- Editor Looks Broken After a CDN Update
- `editor.text is undefined`

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

**Symptom:** Calling `editor.image.insert(...)`, `editor.html.get()` or similar throws `Cannot read properties of undefined (reading '…')`.

**Cause 1 — Called before `initialized`.**
The constructor returns at once and builds the editor asynchronously, so modules such as `editor.html` and plugins such as `editor.image` don't exist yet. Call them only after the `initialized` event fires.

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

**Cause 3 — The selector matched zero or several elements.**
`new FroalaEditor(selector)` returns one instance only when exactly one element matches. With several matches it returns an array of instances, and with none an empty array, so `editor.html` is undefined. Use a unique selector, or pass the DOM element itself.

---

## Editor Does Not Mount / Element Not Found

**Symptom:** No editor appears; no console error or a silent failure.

**Cause 1 — Selector doesn't match any element.**
`new FroalaEditor('#editor')` throws no error if `#editor` doesn't exist: it returns an empty array.

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

## `html.get()` Throws or Returns Stale Content

**Symptom:** `editor.html.get()` throws right after creating the editor, or your copy of the content is out of date.

**Cause — Read before the editor initializes, or read once instead of on change.**

```js
// WRONG — race condition
const editor = new FroalaEditor('#editor', {});
console.log(editor.html.get()); // throws: editor.html does not exist yet

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

## Editor Looks Broken After a CDN Update

**Symptom:** The editor worked, then broke with no code change.

**Cause — CSS and JS versions differ.** Unversioned jsDelivr URLs can serve cached older files independently, so the CSS and JS drift apart.

```html
<!-- Pin the same version in every URL -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_editor.pkgd.min.css">
<script src="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/js/froala_editor.pkgd.min.js"></script>
```

**npm equivalent:** `react-froala-wysiwyg`, `vue-froala-wysiwyg` and `angular-froala-wysiwyg` depend on an exact `froala-editor` version (5.6.0 for wrapper 5.6.0). If the project's own `froala-editor` is a different version, npm installs two copies: plugins and custom buttons register on one copy while the wrapper creates the editor from the other, and they silently don't show up. Check with `npm ls froala-editor` and install the version the wrapper pins.

---

## `editor.text is undefined`

**Symptom:** `editor.text.get()` throws.

**Cause — there is no `text` API.** Use `editor.html.get()` for the content, or `editor.selection.text()` for the selected text.
