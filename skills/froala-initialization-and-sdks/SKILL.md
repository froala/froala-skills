---
name: froala-initialization-and-sdks
description: >
  Use when the user is setting up a Froala editor instance. Activates on:
  import tokens (froala-editor, react-froala-wysiwyg, vue-froala-wysiwyg, angular-froala-wysiwyg, svelte-froala-wysiwyg),
  config tokens (toolbarButtons, heightMin, heightMax, theme, key, attribution, FroalaEditor),
  usage tokens (new FroalaEditor(, FroalaEditorComponent, froalaEditor, <froala>),
  Next.js tokens (next/dynamic, ssr: false, Element is not defined, use client),
  bundle tokens (froala_editor.pkgd.min.js, plugins.pkgd.min.js, froala_style.min.css),
  or when user asks how to install, configure, initialize, or license Froala.
version: 1.0.0
license: MIT
---

# Froala Initialization & SDKs

## What Froala Provides

A complete WYSIWYG HTML editor with a ready-made toolbar UI — not a toolkit for building your own editor UI. Outputs HTML via `editor.html.get()`.

- 50+ plugins, 18 framework integrations, 6 server SDKs
- AI Assist (bring your own provider), Word import/export, Markdown, real-time collaboration, Track Changes
- Commercial license; every plan includes unlimited users, developers and editor loads
- Headless mode requires 5.5.0+ and has limited feature support — for a fully custom editor UI, evaluate it carefully first

---

## Installation

### npm

```bash
npm install froala-editor              # core
npm install react-froala-wysiwyg       # React (peer range React 0.14-19)
npm install vue-froala-wysiwyg         # Vue 3.2+
npm install angular-froala-wysiwyg     # Angular 19+
npm install svelte-froala-wysiwyg      # Svelte (npm peer dep: svelte ^5)
```

Each wrapper pins an **exact** `froala-editor` version (5.6.0 for wrapper 5.6.0). If you also install `froala-editor` directly (needed for its CSS/plugin imports under pnpm or Yarn PnP), install that same version — with two copies, plugins and custom buttons register on one copy while the wrapper creates the editor from the other, and silently don't show up:

```bash
npm install --save-exact react-froala-wysiwyg froala-editor@$(npm view react-froala-wysiwyg dependencies.froala-editor)
```

### CDN — always pin the version

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/css/froala_editor.pkgd.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/css/froala_style.min.css">
<script src="https://cdn.jsdelivr.net/npm/froala-editor@5.6.0/js/froala_editor.pkgd.min.js"></script>
```

Unversioned jsDelivr URLs can serve cached older files, and a CSS/JS version mismatch breaks the editor. Pin the same version in every URL.

Both stylesheets are required: `froala_editor.pkgd.min.css` styles the editor chrome, `froala_style.min.css` styles the content area.

### Which bundle includes which plugins

| File | Contains |
|---|---|
| `js/froala_editor.min.js` | Core only — import each plugin from `js/plugins/<name>.min.js` |
| `js/froala_editor.pkgd.min.js` | Core + most plugins, including AI Assist, Collaborative, Import/Export Word, Markdown, Filestack, Table, Image, Link |
| `js/plugins.pkgd.min.js` | Most plugins, to use with the core in bundlers |

**Not in either `pkgd` bundle** — load separately:

- `js/plugins/track_changes.min.js`
- `js/plugins/edit_in_popup.min.js`
- `js/plugins/trim_video.min.js`
- `js/third_party/`: `embedly`, `font_awesome`, `image_tui`, `imageFileRobot`, `spell_checker`

---

## Vanilla JavaScript

```html
<div id="editor">Hello, Froala!</div>

<script>
  const editor = new FroalaEditor('#editor', {
    key: 'YOUR_ACTIVATION_KEY',
    toolbarButtons: ['bold', 'italic', 'underline', '|', 'insertImage', 'insertLink', 'insertTable'],
    heightMin: 200,
    heightMax: 500,
  });
</script>
```

Place the script before `</body>`, or wrap initialization in `DOMContentLoaded`. `new FroalaEditor('#editor')` fails silently if the element does not exist yet.

---

## React

```jsx
import React, { useState } from 'react';
import FroalaEditorComponent from 'react-froala-wysiwyg';

import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';   // registers the plugins the toolbar below uses

export default function MyEditor() {
  const [model, setModel] = useState('<p>Hello from React!</p>');

  const config = {
    key: 'YOUR_ACTIVATION_KEY',
    toolbarButtons: {
      moreText: { buttons: ['bold', 'italic', 'underline', 'fontSize', 'textColor'] },
      moreParagraph: { buttons: ['alignLeft', 'alignCenter', 'alignRight', 'formatOL', 'formatUL'] },
      moreRich: { buttons: ['insertLink', 'insertImage', 'insertTable'] },
    },
    heightMin: 200,
  };

  return <FroalaEditorComponent tag="textarea" config={config} model={model} onModelChange={setModel} />;
}
```

If you import individual plugins instead of `plugins.pkgd.min.js`, import one for **every** toolbar button you use (`font_size`, `colors`, `align`, `lists`, `table`, `image`, `link`). A button whose plugin is not loaded is simply not rendered — no error.

`react-froala-wysiwyg` destroys the editor on unmount automatically. To call editor methods, keep a ref and use `ref.current.getEditor()`.

---

## Next.js (App Router)

Froala needs the browser DOM. Importing it during server rendering fails the build with `ReferenceError: Element is not defined`. **`'use client'` alone is not enough** — client components are still pre-rendered on the server. Load the editor with `next/dynamic` and `ssr: false`.

```jsx
// app/components/Editor.jsx
'use client';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';
import FroalaEditorComponent from 'react-froala-wysiwyg';

export default function Editor({ model, onModelChange }) {
  return (
    <FroalaEditorComponent
      tag="textarea"
      model={model}
      onModelChange={onModelChange}
      config={{ key: process.env.NEXT_PUBLIC_FROALA_KEY, heightMin: 200 }}
    />
  );
}
```

```jsx
// app/editor/page.jsx
'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const Editor = dynamic(() => import('../components/Editor'), { ssr: false });

export default function Page() {
  const [html, setHtml] = useState('<p>Hello from Next.js!</p>');
  return <Editor model={html} onModelChange={setHtml} />;
}
```

---

## Vue 3

```js
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import 'froala-editor/js/plugins.pkgd.min.js';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
// The package's ES entry is CommonJS, so a plain default import can arrive wrapped
// (Vite 8 / "type": "module" gives a blank page). This form works either way.
import * as VueFroalaModule from 'vue-froala-wysiwyg';
const VueFroala = VueFroalaModule.default?.default ?? VueFroalaModule.default;

createApp(App).use(VueFroala).mount('#app');
```

```vue
<template>
  <froala :tag="'textarea'" :config="config" v-model:value="content"></froala>
</template>

<script setup>
import { ref } from 'vue';

const content = ref('<p>Hello from Vue!</p>');
const config = {
  key: 'YOUR_ACTIVATION_KEY',
  toolbarButtons: ['bold', 'italic', 'underline', '|', 'insertImage'],
  heightMin: 200,
};
</script>
```

The component is registered as **`<froala>`**, not `<froala-editor>`. Use `v-model:value`, not plain `v-model` — the editor doesn't read or update `modelValue`. The current wrapper is Vue 3 only (3.2+). `config` is read once at creation; to apply new options, re-create the component (e.g. change its Vue `:key`).

---

## Angular

The current `angular-froala-wysiwyg` targets **Angular 19+**. The directives ship in two NgModules, `FroalaEditorModule` and `FroalaViewModule`. In a standalone component (the default for new Angular apps) add them to the component's `imports`:

```typescript
// app.ts (app.component.ts before Angular 20)
import { Component } from '@angular/core';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import 'froala-editor/js/plugins.pkgd.min.js';

@Component({
  selector: 'app-root',
  imports: [FroalaEditorModule, FroalaViewModule],
  templateUrl: './app.html',
})
export class App { /* see MyComponent below */ }
```

In an NgModule-bootstrapped app, use `imports: [FroalaEditorModule.forRoot(), FroalaViewModule.forRoot()]` in the module instead.

```html
<div [froalaEditor]="options" [(froalaModel)]="content"></div>
<div [froalaView]="content"></div>
```

```typescript
export class MyComponent {
  content = '<p>Hello from Angular!</p>';
  options = { key: 'YOUR_ACTIVATION_KEY', toolbarButtons: ['bold', 'italic', 'underline'], heightMin: 200 };
}
```

Add the stylesheets in `angular.json`:

```json
"styles": [
  "styles.css",
  "./node_modules/froala-editor/css/froala_editor.pkgd.min.css",
  "./node_modules/froala-editor/css/froala_style.min.css"
]
```

`ng build` fails on a new project once plugins are imported: `plugins.pkgd.min.js` is about 2.5 MB, over the default 1 MB `initial` error budget. Raise the `initial` budget in `angular.json` and add `"allowedCommonJsDependencies": ["froala-editor"]` to silence the CommonJS warning. For SSR, import plugins dynamically inside `isPlatformBrowser(...)` — see the wrapper README.

---

## Other Frameworks

Svelte, Gatsby, Ember, Aurelia, CakePHP, Craft CMS, Ionic, Yii, Meteor, Knockout, Sencha, Django, Rails, Symfony and WordPress all have official integrations: https://froala.com/wysiwyg-editor/docs/framework-plugins/

---

## Common Configuration Options

```js
const config = {
  key: 'YOUR_ACTIVATION_KEY',

  // Toolbar
  toolbarButtons: ['bold', 'italic', 'underline', '|', 'alignLeft', 'alignCenter',
    'alignRight', '|', 'formatOL', 'formatUL', '|', 'insertImage', 'insertLink', 'insertTable'],
  toolbarSticky: true,
  toolbarStickyOffset: 0,
  toolbarInline: false,        // true = no toolbar until text is selected

  // Sizing
  heightMin: 200,
  heightMax: 600,

  theme: 'dark',               // also load css/themes/dark.min.css
  placeholderText: 'Start typing...',
  spellcheck: false,
};
```

**Themes need their own stylesheet.** `dark`, `gray` and `royal` each require `froala-editor/css/themes/<name>.min.css` in addition to the two base stylesheets. Setting `theme` without loading its CSS leaves the editor looking unstyled.

`toolbarButtons` may be a grouped object (`moreText`, `moreParagraph`, `moreRich`, `moreMisc`). Buttons in no group are never rendered.

---

## Licensing

The activation key option is **`key`** — not `licenseKey`, which is not a Froala option and is silently ignored — the editor behaves as if no key were set and shows the missing-key notice.

| Plan | Products / domains | Notes |
|---|---|---|
| Free Trial | — | 30 days, all features, self-hosted |
| Professional | 1 product, 3 domains | Internal and mobile apps — no SaaS or OEM distribution |
| Enterprise | Unlimited products and domains | OEM and SaaS distribution |
| Custom | Unlimited | Custom terms |

Every plan includes unlimited users, developers and editor loads.

**The editor works without a key**, but since 5.6.0 it shows a one-line status notice under the editor, next to "Powered by Froala" — **on `localhost` too** (before 5.6.0, a red "unlicensed" banner that localhost skipped). The text depends on the status, e.g. missing key: "The license key for Froala Editor is missing. To evaluate, use the trial key…"; it is also logged once per page as a `console.warn`. Other statuses: trial, invalid (wrong domain, or key copied incorrectly), expired.

- To evaluate with every plugin enabled, use the public trial key `TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE`. It never licenses a site — do not ship it.
- A valid key covers its domain and all subdomains. Only a plain "Powered by Froala" text remains, removable with `attribution: false`.
- An annual (term) key keeps a clean editor for 15 days after expiry; after that the expired notice shows everywhere, including `localhost`.

Never hardcode a production key in a public repo:

```js
key: process.env.FROALA_ACTIVATION_KEY,
```

Get a key at [cart.froala.com](https://cart.froala.com/).

---

## Common Mistakes

1. **Unversioned CDN URLs** — jsDelivr may serve a cached older file, and a CSS/JS mismatch breaks the editor. Pin `@5.6.0` everywhere.

2. **Missing CSS imports** — the editor renders but looks broken. Both `froala_editor.pkgd.min.css` and `froala_style.min.css` are required, plus the theme CSS if `theme` is set.

3. **Plugin JS not loaded** — a toolbar button whose plugin is missing is silently not rendered. Use a `pkgd` bundle, or import one plugin per button.

4. **Track Changes buttons missing** — `track_changes.min.js` is not in the `pkgd` bundles. Import it separately.

5. **Next.js build failure** — `'use client'` does not prevent server pre-rendering. Use `dynamic(..., { ssr: false })`.

6. **Vue tag wrong** — the component is `<froala>`, not `<froala-editor>`.

7. **Mounting before DOM is ready** — `new FroalaEditor('#editor')` fails silently if the element doesn't exist.

8. **Not destroying on unmount** — memory leaks and duplicate listeners. Call `editor.destroy()` or rely on the framework wrapper.

---

## Reference

- Getting started: https://froala.com/wysiwyg-editor/docs/getting-started/
- Framework integrations: https://froala.com/wysiwyg-editor/docs/framework-plugins/
- Options: https://froala.com/wysiwyg-editor/docs/options/
- Activation: https://froala.com/wysiwyg-editor/docs/activation/
