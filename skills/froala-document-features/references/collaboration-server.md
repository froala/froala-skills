# Collaboration server with wysiwyg-editor-node-sdk

A minimal backend for the collaborative plugin, built from the routes and relay in Froala's Node.js SDK ([source](https://github.com/froala/wysiwyg-editor-node-sdk), `lib/collaborative.js`, `lib/collab_persistence.js`, `lib/version_control.js`, `lib/async_save.js`; its own demo is `examples/server.js` with `examples/collaborative/`).

Checked with froala-editor 5.6.0 and wysiwyg-editor-node-sdk 5.6.0 from npm, Express 5 and Node 24, in Chromium: two users editing the same `docId` live, a later joiner receiving the current content, async-mode save and reload, and a rejected WebSocket upgrade.

## Install

```bash
npm install wysiwyg-editor-node-sdk express
```

`better-sqlite3` and `ws` come with the SDK. `better-sqlite3` is a native module: install on the same OS and Node version you deploy to.

## Server

<!-- validate:skip -->
```js
// server.js
const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const { Collaborative, CollabPersistence, VersionControl, AsyncSave } = require('wysiwyg-editor-node-sdk');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' })); // the save plugin posts form data

// Runs before every /collab/... REST route. Replace with your session/JWT check,
// and check that the user may open req.params.docId.
function authMiddleware(req, res, next) { next(); }

const dbPath = path.join(__dirname, 'collab.db');                   // one SQLite file for everything
CollabPersistence.attachRoutes(app, { dbPath, authMiddleware });    // /collab/:docId/comments, /collab/:docId/suggestions
VersionControl.attachRoutes(app, { dbPath, authMiddleware });       // /collab/:docId/versions
AsyncSave.attachRoutes(app, { dbPath, authMiddleware });            // GET/POST /collab/:docId/content

app.use(express.static(path.join(__dirname, 'public')));            // your app

const server = http.createServer(app);

// WebSocket relay on the same port. The browser connects to `${syncUrl}/${docId}`.
// Quick start without authentication: Collaborative.attachToServer(server);
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', Collaborative.setupWSConnection);
server.on('upgrade', (req, socket, head) => {
  const docId = decodeURIComponent((req.url || '/').slice(1).split('?')[0]);
  if (!canOpen(req, docId)) {                                        // e.g. read your session cookie from req.headers.cookie
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});
function canOpen(req, docId) { return true; }                       // replace

server.listen(process.env.PORT || 3000);
```
<!-- validate:end -->

`Collaborative.attachToServer(server)` is the SDK's one-line alternative: it accepts every connection and also pings clients every 30 seconds to drop dead connections. The version above adds the authentication check; add your own ping interval if you need it.

## Browser

Real-time mode, with the server above on the same origin:

```js
const docId = 'doc-123';
const base = `/collab/${encodeURIComponent(docId)}`;
const syncUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;

new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'collabMode', 'collabPanel', 'collabPresence', 'collabAddComment', 'versionControl'],
  collabConfig: {
    docId,
    user: { id: currentUser.id, name: currentUser.name, role: 'editor' },
    realTime: { syncUrl },
    commentsUrl: `${base}/comments`,
    suggestionsUrl: `${base}/suggestions`,
    versionControl: { url: `${base}/versions`, autoSaveEnabled: false },
  },
  // Keep the document after everyone leaves: the relay stores nothing.
  saveURL: `${base}/content`,
  saveInterval: 10000,
});
```

Render the saved HTML into the editor element before creating the editor (or from your own API), so everyone starts from the stored document: `GET /collab/<docId>/content` returns `{ content, … }`, or 404 when nothing was saved yet. Every connected user's editor saves on the interval; the routes keep one row per document, so the last save wins, which is fine because all editors hold the same content.

Async mode (no WebSocket): leave out `realTime`. Comments, suggestions and versions still use their routes, and you load the content in `initialized`, as the SDK example does:

```js
new FroalaEditor('#editor', {
  collabConfig: {
    docId,
    user: { id: currentUser.id, name: currentUser.name, role: 'suggester' },
    commentsUrl: `${base}/comments`,
    suggestionsUrl: `${base}/suggestions`,
    versionControl: { url: `${base}/versions` },
  },
  saveURL: `${base}/content`,
  saveInterval: 10000,
  events: {
    initialized() {
      const editor = this;
      fetch(`${base}/content`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data && data.content) editor.html.set(data.content); });
    },
  },
});
```

## Before production

- **Authentication and authorization** on every route (`authMiddleware`) and on the WebSocket upgrade. The SDK's own demo opens CORS to `*` and warns that it has no authentication.
- **Roles on the server.** `user.role` is client config. The relay forwards every change from every connection, so a "viewer" with a modified client can still send edits: only let users who may edit open the WebSocket, or give read-only users the async view.
- **Author fields.** The comment, suggestion and version routes store what the browser sends. Set author IDs from the authenticated user if you rely on them.
- **Scale.** The relay keeps rooms in memory in one process. Several server instances need sticky routing by `docId`, or every user of a document must reach the same instance.
- **License key.** Without the `key` option, Froala 5.6.0 adds a "Powered by Froala Editor" paragraph to `html.get()`, and it is saved with the content (reproduced). Set the key.
