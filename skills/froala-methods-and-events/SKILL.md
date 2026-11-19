---
name: froala-methods-and-events
description: >
  Use when working with Froala editor events or API methods: listening for changes, reading or
  setting content, selection and cursor control, keyboard interception, paste cleanup, toolbar command
  hooks, or calling the editor from React, Vue, Angular or Svelte code. Activates on events.on,
  events.bind, contentChanged, initialized, focus, blur, keydown, keyup, commands.before, html.get,
  html.set, html.insert, selection.text, getEditor(), pastePlain, paste.afterCleanup, wordPasteKeepFormatting.
  NOT for building custom toolbar buttons or plugins (froala-custom-plugins) or for upload wiring
  (froala-filestack-integration).
license: MIT
metadata:
  version: "1.1.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-18"
---

# Froala Methods & Events

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. A project that still calls `.froalaEditor()` on a jQuery object runs Froala 2: upgrading means switching to `new FroalaEditor(...)`. Names that start with `$` in the current API (`editor.$el`, the `$btn` passed to `refresh`, the `$popup` from `editor.popups.create`) are Froala's own DOM helpers, not jQuery: keep using them where the API hands them to you.

## Initialization Hook

Always bind events **inside** the `events.initialized` callback or via the `events` config object — the editor instance is not safe to use until initialization completes.

```js
const editor = new FroalaEditor('#editor', {
  events: {
    initialized() {
      // `this` is the editor instance
      console.log('Editor ready');
    },
  },
});
```

---

## Event Binding

**Via config (preferred — guaranteed before first render):**

```js
new FroalaEditor('#editor', {
  events: {
    contentChanged() {
      console.log('Content changed:', this.html.get());
    },
    focus() {
      console.log('Editor focused');
    },
    blur() {
      console.log('Editor blurred');
    },
  },
});
```

**Via `editor.events.on` (after initialization) — vanilla JS only:**

```js
const editor = new FroalaEditor('#editor', {
  events: {
    initialized() {
      this.events.on('contentChanged', function () {
        console.log('Changed:', this.html.get());
      });
    },
  },
});
```

In React, prefer `config.events`: React StrictMode (development only) mounts the component twice, so code inside `initialized` runs twice (three times up to 5.5.0).

**The editor is `this`, not a parameter.** Froala calls every handler as `handler.apply(editor, eventArguments)`. Handlers copied from old examples in the form `function (e, editor) { editor.html.get(); }` fail, because the second parameter is not the editor. Use a regular `function` (or method shorthand) and `this`. Arrow functions do not receive `this`. Returning `false` from a handler stops the event.

---

## Common Events Reference

| Event | When it fires |
|-------|--------------|
| `initialized` | Editor is fully ready |
| `contentChanged` | Editor content changes |
| `focus` | Editor receives focus |
| `blur` | Editor loses focus |
| `keydown` | Key pressed down |
| `keyup` | Key released |
| `click` | Click inside editor |
| `mouseup` | Mouse button released |
| `commands.before` | Before a toolbar command executes |
| `commands.after` | After a toolbar command executes |
| `image.beforeUpload` | Before image upload starts (use to intercept) |
| `image.uploaded` | After image uploaded to server |
| `image.inserted` | After image inserted into editor |
| `paste.before` | Before paste event |
| `paste.afterCleanup` | After paste content is cleaned up |
| `html.set` | After `editor.html.set()` is called |
| `image.error` | Image upload or insertion fails |
| `word.beforeImport` / `word.afterImport` | Around Word (.docx) import |
| `markdown.beforeGet` / `markdown.afterGet` | Around `markdown.getMarkdown()` (5.4.0+) |
| `markdown.beforeSet` / `markdown.set` | Around `markdown.setMarkdown()` (5.4.0+). `markdown.set` also fires when nothing was applied (Markdown mode off): check the return value, not the event |
| `destroy` | Editor is being destroyed — clean up your own listeners and timers |
| `paintFormat.start` / `paintFormat.applied` / `paintFormat.end` | Paint Format mode (5.6.0+) |
| `accessibilityChecker.shown` / `accessibilityChecker.repaired` / `accessibilityChecker.ignored` | Accessibility Checker popup opened, an issue repaired or ignored (5.6.0+) |

---

## Getting & Setting HTML Content

```js
// Get the editor's HTML content
const html = editor.html.get();           // includes formatting tags

// Set the editor's HTML content
editor.html.set('<p>New content</p>');
editor.html.insert('<b>inserted</b>');

// Selection
const selected = editor.selection.text();     // selected text, plain
const el = editor.selection.element();        // selected element
editor.selection.save();
editor.selection.restore();
```

**There is no `editor.text.get()`.** That API does not exist and throws. Use `editor.html.get()` for the content, or `editor.selection.text()` for the selected text.

**React (via model):**

```jsx
// Use model / onModelChange instead of reading content directly
<FroalaEditorComponent
  tag="textarea"
  model={content}
  onModelChange={setContent}
/>
```

To call editor methods in React, keep a ref and use `getEditor()` — the public, typed API of the wrapper:

```jsx
const ref = useRef(null);
// ...
<FroalaEditorComponent ref={ref} model={content} onModelChange={setContent} />
// ...
// getEditor() returns the editor object once the component has mounted, but its modules
// (html, selection, …) only exist after the editor has initialized.
ref.current?.getEditor()?.html?.insert('<strong>Inserted!</strong>');
```

**Content changed from code does not reach `onModelChange`.** `html.insert()` and `html.set()` do not fire `contentChanged`; in the core only `undo.saveStep()`, undo and redo do. The wrapper updates `model` on `contentChanged`, so without the extra call the change is in the editor but not in your state, and a save made from `model` silently loses it. After changing content from your own code, call `saveStep()`:

```jsx
const editor = ref.current?.getEditor();
if (editor?.html) {
  editor.html.insert('<strong>Inserted!</strong>');
  editor.undo.saveStep(); // adds an undo step and fires contentChanged, so onModelChange runs
}
```

React wrapper notes:

- Updating `model` from your own code (for example after loading a draft) resets the undo history. Add the `skipReset` prop to keep it.
- `onModelChange` is called on `contentChanged`. Set the wrapper option `immediateReactModelUpdate: true` in `config` to also update on every `keyup`. Up to 5.5.0 it also fires once when the editor loads, with unchanged content; 5.6.0 calls it only on real changes.
- **Every wrapper** (React, Vue, Angular, Svelte) updates its model only on `contentChanged`, so the `undo.saveStep()` rule above applies to all of them. Reproduced in React, Vue and Angular: without it the model misses the change.
- Vue: bind with `v-model:value`. For the instance, put a template ref on `<froala>` and call `editorRef.value?.getEditor()`.
- Svelte: `bind:model`, and `bind:editor` for the instance.
- Angular: `[(froalaModel)]`. For the instance, listen to `(froalaInit)`. It hands you `{ initialize, destroy, getEditor }` and switches the directive to manual start: the editor is not created until you call `initialize()`. The wrapper types the payload as `Object`, so a typed parameter fails strict templates; take it as `any`:

```typescript
// template: <div [froalaEditor]="options" [(froalaModel)]="content" (froalaInit)="onInit($event)"></div>
private controls: any;

onInit(controls: any) {
  this.controls = controls;
  controls.initialize(); // required once (froalaInit) is bound
}

insertSignature() {
  const editor = this.controls?.getEditor();
  if (!editor?.html) return;
  editor.html.insert('<p><em>Signed</em></p>');
  editor.undo.saveStep(); // otherwise [(froalaModel)] misses the change
}
```

---

## Keyboard Interception

```js
new FroalaEditor('#editor', {
  events: {
    keydown(e) {
      // e is the native KeyboardEvent
      if (e.key === 'Tab') {
        e.preventDefault();
        this.html.insert('&nbsp;&nbsp;&nbsp;&nbsp;'); // Insert 4 spaces on Tab
        return false;
      }
    },
    keyup(e) {
      console.log('Key up:', e.key);
    },
  },
});
```

---

## Paste Cleanup Configuration

Control what formatting is stripped when pasting from external sources (Word, Google Docs, etc.):

```js
new FroalaEditor('#editor', {
  // Strip Word formatting
  wordPasteModal: false,         // Don't show the "paste from Word" modal
  wordPasteKeepFormatting: false, // Strip Word formatting on paste

  // Plain text paste
  pastePlain: false,             // true = strip all formatting on paste

  // Fine-grained paste cleanup
  htmlAllowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
  htmlAllowedAttrs: ['href', 'target'],
  htmlRemoveTags: ['script', 'style'],

  events: {
    'paste.afterCleanup'(clipboardHtml) {
      // Modify or inspect the cleaned paste content
      return clipboardHtml.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');
    },
  },
});
```

`htmlAllowedTags` / `htmlAllowedAttrs` / `htmlRemoveTags` govern the HTML the editor emits, so change them deliberately.

**Security:** client-side cleanup is **not** a security boundary. Always sanitize submitted HTML on the server (for example with an allowlist sanitizer) before storing or displaying it. When displaying saved content, wrap it in an element with the `fr-view` class and load `froala_style.min.css`.

---

## Calling Editor API Methods Safely

**Problem:** Calling methods before initialization causes `Cannot read property of undefined` errors.

**Fix:** Always wrap post-init API calls in the `initialized` event:

```js
// WRONG — editor not ready yet
const editor = new FroalaEditor('#editor');
editor.html.set('<p>Hello</p>'); // Error: html is undefined

// CORRECT
new FroalaEditor('#editor', {
  events: {
    initialized() {
      this.html.set('<p>Hello</p>'); // Safe
    },
  },
});
```

**For React refs:**

```jsx
import { useRef } from 'react';
import FroalaEditorComponent from 'react-froala-wysiwyg';

export default function Editor() {
  const editorRef = useRef(null);

  const insertContent = () => {
    // Optional early action: guard both the editor and its html module.
    // If the action must succeed, enable the button only after the `initialized` event.
    const editor = editorRef.current?.getEditor();
    if (!editor?.html) return;
    editor.html.insert('<strong>Inserted!</strong>');
    editor.undo.saveStep(); // without it, onModelChange never sees the inserted content
  };

  return (
    <>
      <FroalaEditorComponent ref={editorRef} config={{}} />
      <button onClick={insertContent}>Insert</button>
    </>
  );
}
```

---

## Toolbar Command Events

```js
new FroalaEditor('#editor', {
  events: {
    'commands.before'(cmd) {
      console.log('About to run:', cmd);
      // Return false to cancel the command
    },
    'commands.after'(cmd) {
      console.log('Ran:', cmd);
    },
  },
});
```

---

## Programmatic Focus & Cursor Control

```js
// Focus the editor
editor.events.focus();

// Place cursor at end
editor.selection.setAtEnd(editor.el);
editor.selection.restore();

// Select all content
editor.commands.selectAll();
```
