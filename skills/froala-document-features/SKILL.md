---
name: froala-document-features
description: >
  Use when the user is working with Froala's document-workflow plugins. Activates on:
  Word tokens (import_from_word, export_to_word, importFromWordUrlToUpload, wordExportFileName,
  importFromWordMaxFileSize, importFromWordMammoth, mammoth, docx, html-docx-js, word.beforeImport, word.afterExport),
  Markdown tokens (markdown.getMarkdown, markdown.setMarkdown, markdown plugin),
  track changes tokens (trackChanges, showChanges, applyAll, removeAll, trackChangesEnabled, track_changes.min.js),
  collaboration tokens (collabConfig, collabMode, collabPanel, collabPresence, collabAddComment, versionControl,
  syncUrl, suggestion mode, mentionableUsers, collaborative.min.js, wysiwyg-editor-node-sdk),
  or when user asks about importing or exporting Word documents, Markdown editing,
  tracking changes, review workflows, comments, or real-time multi-user editing in Froala.
version: 1.0.0
license: MIT
---

# Froala Document Features

Covers Word import/export, Markdown, Track Changes and real-time collaboration.

Version gates (verified against 5.6.0): Export to Word **4.7.0+**; Import from Word **5.0.0+** (`importFromWordMammoth` 5.3.0+); Collaborative plugin **5.3.0+**; `markdown.getMarkdown()` / `setMarkdown()` and the `markdown.*` events **5.4.0+**. The Markdown toggle and Track Changes plugins exist across v4 and v5.

---

## Word Import and Export

Import converts a `.docx` in the browser with mammoth.js, or server-side if you set an upload URL. Export writes a `.docx` from the editor content using the global `window.htmlDocx` and `window.saveAs`.

```html
<!-- Import (client-side conversion) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.21/mammoth.browser.min.js"></script>
<!-- Export -->
<script src="https://cdn.jsdelivr.net/npm/file-saver-es@2.0.5/dist/FileSaver.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.min.js"></script>
```

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'import_from_word', 'export_to_word'],

  importFromWordMaxFileSize: 3 * 1024 * 1024,   // default 3 MB
  importFromWordFileTypesAllowed: ['docx'],
  importFromWordUrlToUpload: null,              // null = convert in the browser with mammoth.js
  importFromWordEnableImportOnDrop: true,       // drop a .docx onto the editor to import
  // importFromWordMammoth: mammoth,           // default window.mammoth, read when the plugin loads
  wordExportFileName: 'document',               // default 'froala_editor'; .docx extension is added automatically

  events: {
    'word.beforeImport'(file) {},               // return false to cancel
    'word.afterImport'(html) {},
    'word.beforeExport'(editorHtml) {},
    'word.afterExport'(editorHtml) {},
  },
});
```

`importFromWordMammoth` defaults to `window.mammoth` **as it was when the plugin script loaded** — load mammoth.js before the plugin, or with Vite/webpack `import mammoth from 'mammoth'` and pass `importFromWordMammoth: mammoth`. For export in a bundler, assign the libraries to `window.htmlDocx` and `window.saveAs`. Programmatic import: `editor.importFromWord.import(file?)`.

Both plugins (`importFromWord`, `exportToWord`) are in the `pkgd` bundles. With the core build, load `js/plugins/import_from_word.min.js` and `js/plugins/export_to_word.min.js`.

Docs: [Import from Word](https://froala.com/wysiwyg-editor/docs/plugins/import-from-word-plugin/) · [Export to Word](https://froala.com/wysiwyg-editor/docs/plugins/export-to-word-plugin/)

---

## Markdown

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'markdown'],

  events: {
    initialized() {
      this.markdown.toggle();                   // enter markdown mode
      this.markdown.setMarkdown('# Title\n\nSome **bold** text');
      const md = this.markdown.getMarkdown();   // string, or false if cancelled by markdown.beforeGet
    },
  },
});
```

`markdown.getMarkdown()` returns `false` rather than a string when a `markdown.beforeGet` handler cancels the read — check the type before using the result. `setMarkdown()` returns `true` when applied in markdown mode, `null` when markdown mode is off (content is stored, not shown), and `false` for a non-string or when `markdown.beforeSet` cancels. Other methods: `markdown.toggle()`, `markdown.isEnabled()`. Events: `markdown.beforeGet`, `markdown.afterGet`, `markdown.beforeSet`, `markdown.set`. Requires 5.4.0+ for get/set and these events; also load `css/plugins/markdown.min.css` with the core build.

Docs: https://froala.com/wysiwyg-editor/docs/plugins/markdown-plugin/

---

## Track Changes

**Not included in the `pkgd` bundles** (confirmed in 5.6.0 `froala_editor.pkgd.min.js` / `plugins.pkgd.min.js`). Load it explicitly, or the buttons never render. Plugin name: `track_changes`.

```js
import 'froala-editor/js/plugins/track_changes.min.js';

new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'trackChanges'],
  trackChangesEnabled: true,   // start with tracking on (default false)
  showChangesEnabled: true,    // highlight changes (default false)
});
```

The `trackChanges` button toggles recording and opens a sub-toolbar that automatically contains the other buttons:

| Button | Action |
|---|---|
| `trackChanges` | Toggle recording; opens the track-changes sub-toolbar |
| `showChanges` | Toggle highlighting |
| `applyAll` / `removeAll` | Accept / reject every change |
| `applyLast` / `removeLast` | Accept / reject the last change |

Methods: `track_changes.toggleTracking()`, `track_changes.showChanges()`, `track_changes.getPendingChanges()`, `track_changes.acceptAllChanges()`, `track_changes.acceptSingleChange()`, `track_changes.rejectSingleChange()`.

Docs: https://froala.com/wysiwyg-editor/docs/plugins/track-changes-plugin/

---

## Real-Time Collaboration

Live multi-user editing (Yjs CRDT over WebSocket), presence, threaded comments with @mentions, suggestion mode and version history. Plugin name `collaborative` (`js/plugins/collaborative.min.js` + `css/plugins/collaborative.min.css`), included in the `pkgd` bundles. **Persistence and live sync require a backend** — it ships in the `wysiwyg-editor-node-sdk` package (WebSocket relay, comments/suggestions REST endpoints, version store, async content-save endpoint; uses `better-sqlite3`).

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'collabMode', 'collabPanel', 'collabPresence', 'collabAddComment', 'versionControl'],

  collabConfig: {
    docId: 'doc-123',                                 // shared by all collaborators (default 'default-doc')
    user: { id: 'u1', name: 'Ada', role: 'editor' },  // 'editor' | 'suggester' | 'viewer'
    realTime: { syncUrl: 'wss://your-server.example/collab' },  // omit / syncUrl null = async offline-first mode
    commentsUrl: '/api/comments',                     // GET/POST; PATCH/DELETE append /{id}
    suggestionsUrl: '/api/suggestions',
    versionControl: { url: '/api/versions', autoSaveEnabled: true },  // {} = in-memory versions only
    mentionableUsers: [{ id: 'u2', name: 'Grace' }],
  },

  events: {
    'collab.connectionStatus'(status) {},   // 'connecting' | 'connected' | 'disconnected'
    'collab.synced'() {},
  },
});
```

Every collaborator on the same document must use the same `docId`. Without `realTime.syncUrl` the plugin runs in async (offline-first) mode using `commentsUrl`, `suggestionsUrl` and `versionControl.url`. In real-time mode, comments/suggestions/versions are only shared live — they are not persisted unless those URLs are set. Other events: `collab.modeChanged(newMode, prevMode)`, `collab.panelStateChanged`, `collab.remoteContentChanged`. Panel start state: `collabConfig.panel.defaultState` (`'expanded'` | `'collapsed'` | `'hidden'`).

Requires 5.3.0+. Docs: https://froala.com/wysiwyg-editor/docs/plugins/collaborative-plugin/

---

## Common Mistakes

| Problem | Cause | Fix |
|---|---|---|
| Track Changes buttons missing | `track_changes.min.js` not loaded — it is not in the `pkgd` bundles | Import the plugin explicitly |
| Word import does nothing | mammoth.js not loaded and `importFromWordUrlToUpload` is null | Load mammoth.js, or set a server upload URL |
| Word export does nothing | FileSaver / html-docx-js not loaded | Load both export dependencies |
| Import silently rejects a file | Over `importFromWordMaxFileSize` (default 3 MB) or not in `importFromWordFileTypesAllowed` | Raise the limit or allow the type |
| `getMarkdown()` returns `false` | A `markdown.beforeGet` handler cancelled the read | Check the return type before using it |
| Collaborators don't see each other | Different `docId`, or no reachable `syncUrl` | Share one `docId`; check the WebSocket connection |
| Suggestions can't be made | `role: 'viewer'` (viewing only), or an `editor` still in Editing mode | Use `role: 'suggester'` (starts in Suggesting), or switch an editor to Suggesting via `collabMode` |
| Comments/versions vanish after everyone leaves | Real-time mode without persistence URLs | Set `commentsUrl`, `suggestionsUrl`, `versionControl.url` |
| Word import fails in a Vite/webpack build | `window.mammoth` undefined when the plugin loaded | Pass `importFromWordMammoth: mammoth` |

---

## Reference

- Plugins index: https://froala.com/wysiwyg-editor/docs/plugins/
- Server SDKs: https://froala.com/wysiwyg-editor/docs/sdks/
- Collaboration backend: https://froala.com/wysiwyg-editor/docs/sdks/nodejs/collaboration-overview/
