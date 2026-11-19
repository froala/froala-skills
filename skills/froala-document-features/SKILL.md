---
name: froala-document-features
description: >
  Use when working with Froala's document-workflow plugins: Word (.docx) import and export, Markdown
  input/output, Track Changes, and real-time collaboration with comments, suggestion mode and version
  history. Activates on import_from_word, export_to_word, importFromWordMammoth, importFromWordUrlToUpload,
  wordExportFileName, mammoth, html-docx-js, file-saver, word.beforeImport, word.afterExport,
  markdown.getMarkdown, markdown.setMarkdown, trackChanges, showChanges, applyAll, removeAll,
  track_changes.min.js, collabConfig, collabMode, collabPanel, versionControl, syncUrl or
  wysiwyg-editor-node-sdk. NOT for AI features (froala-ai-assist).
license: MIT
metadata:
  version: "1.1.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-18"
---

# Froala Document Features

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. A project that still calls `.froalaEditor()` on a jQuery object runs Froala 2: upgrading means switching to `new FroalaEditor(...)`. Names that start with `$` in the current API (`editor.$el`, the `$btn` passed to `refresh`, the `$popup` from `editor.popups.create`) are Froala's own DOM helpers, not jQuery: keep using them where the API hands them to you.

Covers Word import/export, Markdown, Track Changes and real-time collaboration.

**Check the version first** (`node_modules/froala-editor/package.json`):

| Feature | Needs |
|---|---|
| Export to Word | 4.7.0+ |
| Import from Word | 5.0.0+ |
| Collaborative plugin | 5.3.0+ |
| `markdown.getMarkdown()` / `setMarkdown()` and `markdown.*` events | 5.4.0+ |

---

## Word Import and Export

Import converts a `.docx` in the browser with mammoth.js, or on your server if you set an upload URL. Export builds a `.docx` in the browser with html-docx-js and saves it with FileSaver.

**Security:** 5.6.0 fixes potential cross-site scripting (XSS) vulnerabilities in the Word Export plugin (Froala release notes). Use 5.6.0 or newer when users export content they or others wrote.

### Dependencies

| Feature | Library | Global the plugin uses |
|---|---|---|
| Import | `mammoth` **1.11.0 or newer** (older versions have a directory-traversal advisory, GHSA-rmjr-87wv-gf87) | `window.mammoth`, or the `importFromWordMammoth` option |
| Export | `html-docx-js` | `window.htmlDocx` |
| Export | `file-saver` | `window.saveAs` |

**Bundlers (Vite, webpack):**

```js
import mammoth from 'mammoth';              // its "browser" field picks the browser build
import htmlDocx from 'html-docx-js/dist/html-docx';
import { saveAs } from 'file-saver';

window.htmlDocx = htmlDocx; // export reads these globals when the user clicks Export
window.saveAs = saveAs;

new FroalaEditor('#editor', {
  importFromWordMammoth: mammoth, // pass mammoth directly instead of relying on a global
});
```

**CDN** — load these **before** the Froala scripts (the import plugin reads `window.mammoth` when it loads):

```html
<script src="https://cdn.jsdelivr.net/npm/mammoth@MAMMOTH_VERSION/mammoth.browser.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>
```


### Configuration

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'import_from_word', 'export_to_word'],

  importFromWordMaxFileSize: 3 * 1024 * 1024,   // default 3 MB
  importFromWordFileTypesAllowed: ['docx'],
  importFromWordUrlToUpload: null,              // null = convert in the browser with mammoth.js
  importFromWordEnableImportOnDrop: true,       // drop a .docx onto the editor to import
  wordExportFileName: 'document',               // .docx is added automatically

  events: {
    'word.beforeImport'() {},                   // return false to cancel
    'word.afterImport'() {},
    'word.beforeExport'(editorHtml) {},
    'word.afterExport'(editorHtml) {},
  },
});
```

Both plugins are in the `pkgd` bundles. With the core build, load `js/plugins/import_from_word.min.js` and `js/plugins/export_to_word.min.js`. Plugin names for `pluginsEnabled`: `importFromWord`, `exportToWord`.

**Export limits to tell users about:** html-docx-js output is made for Microsoft Word — its own README says LibreOffice and Google Docs do not support the format it uses — and it only embeds images given as data URIs. Test exports that contain images. If other apps must open the files, convert HTML to DOCX on the server instead.

Docs: [Import from Word](https://froala.com/wysiwyg-editor/docs/plugins/import-from-word-plugin/) · [Export to Word](https://froala.com/wysiwyg-editor/docs/plugins/export-to-word-plugin/)

---

## Markdown

**`getMarkdown()` and `setMarkdown()` depend on Markdown mode.** Check `markdown.isEnabled()` first:

| Markdown mode | `setMarkdown(md)` | `getMarkdown()` |
|---|---|---|
| On | Replaces the editor content, returns `true` | Converts the current editor content to Markdown |
| Off | Does **not** change the editor; stores `md` and returns `null` | Returns the stored value, not the editor content |

Either call returns `false` when a `markdown.beforeGet` / `markdown.beforeSet` handler cancels it, or (setter) when the argument is not a string.

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'markdown'],

  events: {
    initialized() {
      if (!this.markdown.isEnabled()) this.markdown.toggle(); // the app works in Markdown mode
      const applied = this.markdown.setMarkdown('# Title\n\nSome **bold** text');
      if (applied !== true) console.warn('Markdown was not applied to the editor', applied);
    },
  },
});
```

**Verify what users and the database see, not the setter/getter pair.** A `setMarkdown()` followed by `getMarkdown()` can "pass" while the editor still shows the old content. Check the visible editor (`html.get()`), the exact payload the app saves, and the document after a reload.

Events (5.4.0+): `markdown.beforeGet`, `markdown.afterGet`, `markdown.beforeSet`, `markdown.set`.

**`markdown.set` is not a confirmation.** In 5.6.0 it also fires when `setMarkdown()` applied nothing (Markdown mode off, return value `null`; reproduced). To know whether a document was loaded, check that `setMarkdown()` returned `true`.

Round-trip Markdown → editor → Markdown with your real content before relying on it (line breaks and lists are the usual edge cases).

Docs: https://froala.com/wysiwyg-editor/docs/plugins/markdown-plugin/

---

## Track Changes

**Not included in the `pkgd` bundles.** Load it explicitly, or the buttons never render. Its plugin name for `pluginsEnabled` is `track_changes` (with an underscore).

```js
import 'froala-editor/js/plugins/track_changes.min.js';

new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'trackChanges', 'showChanges', 'applyAll', 'removeAll'],
  trackChangesEnabled: true,   // start with tracking on
  showChangesEnabled: true,    // highlight changes
});
```

| Button | Action |
|---|---|
| `trackChanges` | Toggle recording |
| `showChanges` | Toggle highlighting |
| `applyAll` | Accept every change |
| `removeAll` | Reject every change |

Docs: https://froala.com/wysiwyg-editor/docs/plugins/track-changes-plugin/

---

## Real-Time Collaboration

Live multi-user editing, presence, threaded comments with @mentions, suggestion mode and version history. **Requires a backend.** The Node.js SDK `wysiwyg-editor-node-sdk` contains the collaboration server code (`lib/collaborative.js`, `lib/version_control.js`) and an example in `examples/collaborative/`.

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'collabMode', 'collabPanel', 'collabPresence', 'versionControl'],

  collabConfig: {
    docId: 'doc-123',                                 // shared by all collaborators
    user: { id: 'u1', name: 'Ada', role: 'editor' },  // 'editor' | 'suggester' | 'viewer'
    realTime: { syncUrl: 'wss://your-server.example/collab' },  // omit for no live sync
    commentsUrl: '/api/comments',
    suggestionsUrl: '/api/suggestions',
  },

  events: {
    'collab.connectionStatus'(status) {},   // 'connecting' | 'connected' | 'disconnected'
    'collab.synced'() {},
  },
});
```

Every collaborator on the same document must use the same `docId`. Live sync only starts when `realTime.syncUrl` is set.

**Roles and modes.** The `collabMode` button switches between editing, suggesting and viewing. The role limits which modes a user may choose:

| Role | Allowed modes |
|---|---|
| `editor` | editing, suggesting, viewing |
| `suggester` | suggesting, viewing |
| `viewer` | viewing |

Roles are a UI convenience. Enforce permissions on your server too — a user can change client-side config.

Requires 5.3.0+. Docs: https://froala.com/wysiwyg-editor/docs/plugins/collaborative-plugin/

---

## Common Mistakes

| Problem | Cause | Fix |
|---|---|---|
| Track Changes buttons missing | `track_changes.min.js` not loaded — it is not in the `pkgd` bundles | Import the plugin explicitly |
| Word import does nothing | mammoth.js missing, or loaded after the Froala plugin | Load mammoth first, or pass `importFromWordMammoth: mammoth` |
| Word export shows an error popup | `window.htmlDocx` or `window.saveAs` missing | Load `html-docx-js` and a FileSaver build that defines `window.saveAs`, or assign both globals |
| Exported file won't open in LibreOffice/Google Docs | html-docx-js output targets Microsoft Word | Convert on the server if needed |
| Import silently rejects a file | Over `importFromWordMaxFileSize` (default 3 MB) or not in `importFromWordFileTypesAllowed` | Raise the limit or allow the type |
| `getMarkdown()` returns `false` | A `markdown.beforeGet` handler cancelled the read | Check the return type before using it |
| `setMarkdown()` returns `null` and the editor is unchanged | Markdown mode is off, so the value was only stored | Turn Markdown mode on first (`markdown.toggle()`), or load HTML with `html.set()` |
| Collaborators don't see each other | Different `docId`, or no reachable `syncUrl` | Share one `docId`; check the WebSocket connection |
| Suggestions can't be made | Role is `viewer`, or an `editor` is still in editing mode | Switch mode with `collabMode`; give viewers the `suggester` role |

---

## Reference

- Plugins index: https://froala.com/wysiwyg-editor/docs/plugins/
- Server SDKs: https://www.froala.com/wysiwyg-editor/docs/sdks/nodejs
