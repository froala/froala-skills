# Node.js: the official SDK and a hardened Express router

Part of the froala-uploads-and-storage skill. Verified against `wysiwyg-editor-node-sdk` 5.6.0 from npm (`lib/*.js`), run under Node 24 with Express 5.3.0, and driven from `froala-editor` 5.6.0 in headless Chromium.

## Contents

- The SDK API
- What the SDK does not do
- A hardened router (Express 5 + multer 2)
- Mounting it

## The SDK API

Install: `npm install wysiwyg-editor-node-sdk`. Froala's docs name the import `FroalaEditor`; this file uses FroalaSDK so it is not confused with the browser `FroalaEditor` class.

```js
const FroalaSDK = require('wysiwyg-editor-node-sdk');

app.post('/upload_image', (req, res) => {
  FroalaSDK.Image.upload(req, '/uploads/', (err, data) => {
    if (err) return res.status(400).json({ error: String(err) });
    res.json(data); // { link: '/uploads/<sha1>.<ext>' }
  });
});
```

| Call (5.6.0) | What it does |
|---|---|
| `Image.upload(req, fileRoute, [options], callback)` | Parses the multipart `req` with busboy, writes the file to `<dir of the main script>` + the route + `sha1(timestamp).<client extension>`, validates it, calls back `(err, { link })` with the route plus the name. Do not put a body parser in front of the route. |
| `File.upload(...)`, `Video.upload(...)` | The same, with file or video defaults |
| `Image.delete(src, callback)`, `File.delete`, `Video.delete` | `fs.unlink(path.join(<dir of the main script>, src))` |
| `Image.list(folderPath, [thumbPath], callback)` | Calls back with `[{ url, thumb, tag }]` (`tag` is the file name) for files with an allowed image extension: the image manager format |
| `S3.getHash(config)` | Returns `{ bucket, region, keyStart, params }` for `imageUploadToS3`; see s3-and-azure.md |

Options (third argument), with their defaults:

| Key | Image | File | Video |
|---|---|---|---|
| `fieldname` | `'file'` | `'file'` | `'file'` |
| `validation` | `{ 'allowedExts': ['gif','jpeg','jpg','png','svg','blob'], 'allowedMimeTypes': [...] }` | `['txt','pdf','doc']` and matching types | `['mp4','webm','ogg']` |
| `resize` | `null`; `[width, height]` resizes with ImageMagick through `gm` | | `null` |

`validation` can also be a function `(filePath, mimetype, callback)` that calls `callback(null, true)` to accept; it runs after the file is written.

## What the SDK does not do

Found by reading the 5.6.0 source and by uploading crafted files to it:

- **Validation trusts the client.** It checks the extension of the client's file name and the client's `Content-Type`. A PHP script uploaded as evil.png with `image/png` was stored. So was an SVG with an `onload` handler (SVG is in the default list).
- **WebP is rejected by default** although the editor allows it (`imageAllowedTypes` includes `webp`); the user sees an upload error.
- **No size limit.** busboy runs without limits, so a large upload fills the disk; the example's size check runs after the file is written.
- **Delete takes any path.** `Image.delete(req.body.src)` (as in the SDK example) unlinks `path.join(appDir, src)`, so `src=../../.env` deletes outside the uploads folder. Validate `src` first.
- **The upload folder must exist**, and paths are relative to `require.main.filename`, which differs under some process managers and test runners.
- **Names are `sha1(Date.now())`**: guessable, and two uploads in the same millisecond collide.
- **Error responses in the SDK example** are `res.send(JSON.stringify(err))` with status 200. The editor reports code 2. Return a 4xx with JSON instead.
- **Dependencies:** `busboy` ~0.2.13 pulls `dicer` 0.2.5 (GHSA-wm7h-9275-46v2, high: a crafted multipart request crashes the process; no fix in 0.2). `crypto-js` 3.x (two critical advisories) is a dependency but unused by the upload code. `better-sqlite3` and `ws` are installed for the collaboration modules. `resize` needs ImageMagick installed.

Use the SDK for prototypes. For production, use a maintained multipart parser and the rules below.

## A hardened router (Express 5 + multer 2)

Tested with Express 5.3.0 and multer 2.5.0. It accepts PNG, JPEG, GIF and WebP images and PDF files, detected from the bytes; generates the name; limits size to 5 MB; requires your auth middleware; and validates `src` on delete. Video works the same way (add the container's signature bytes).

```js
// uploads.js: Froala upload, delete and image manager routes (Express 5, multer 2, CommonJS).
const express = require('express');
const multer = require('multer');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const IMAGE_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
const STORED_NAME = /^[0-9a-f-]{36}\.(png|jpg|gif|webp|pdf)$/;

// Detect the type from the first bytes. Never trust the client's file name or Content-Type.
function sniff(buf) {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString('latin1'))) return 'image/gif';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  return null;
}

module.exports = function uploadRoutes({ requireUser, uploadDir, publicPath = '/uploads/' }) {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

  async function store(req, res, allowed) {
    if (!req.file) return res.status(400).json({ error: 'No file in field "file"' });
    const type = sniff(req.file.buffer);
    if (!allowed[type]) return res.status(415).json({ error: 'File type not allowed' });
    const name = `${crypto.randomUUID()}.${allowed[type]}`;
    await fs.writeFile(path.join(uploadDir, name), req.file.buffer, { flag: 'wx' });
    // Record the owner (req.user) and the name in your database here.
    res.json({ link: publicPath + name });
  }

  // imageUploadURL: multipart field "file" (imageUploadParam); reply { "link": "..." }
  router.post('/api/uploads/image', requireUser, upload.single('file'), (req, res) => store(req, res, IMAGE_EXT));
  // fileUploadURL: PDF only in this example
  router.post('/api/uploads/file', requireUser, upload.single('file'), (req, res) => store(req, res, { 'application/pdf': 'pdf' }));

  // imageManagerLoadURL: an array of { url, thumb } objects
  router.get('/api/uploads/images', requireUser, async (req, res) => {
    const names = (await fs.readdir(uploadDir)).filter((n) => STORED_NAME.test(n) && !n.endsWith('.pdf'));
    res.json(names.map((n) => ({ url: publicPath + n, thumb: publicPath + n })));
  });

  // Delete: JSON from your own fetch() calls, form-encoded "src" from the image manager
  router.post('/api/uploads/delete', requireUser, express.json(), express.urlencoded({ extended: false }), async (req, res) => {
    const name = path.posix.basename(new URL(String(req.body.src || ''), 'http://localhost').pathname);
    if (!STORED_NAME.test(name)) return res.status(400).json({ error: 'Unknown file' });
    // Check in your database that req.user owns this file and no saved document still uses it.
    await fs.rm(path.join(uploadDir, name), { force: true });
    res.status(200).json({ ok: true }); // the image manager needs exactly 200
  });

  router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.message });
    next(err);
  });
  return router;
};
```

What the browser run showed: an image upload inserted `/uploads/<uuid>.png`; a request without a session got 401 and `image.error` code 3 with `{"error":"Sign in first"}` as the response; a file whose bytes were not a PDF got 415 (code 3); `src=/uploads/../server.js` got 400; the image manager listed, inserted and deleted files through these routes.

The image manager loads with `GET` and the list is per server here. Filter it by the signed-in user in a real app.

## Mounting it

```js
const path = require('node:path');
const express = require('express');
const uploadRoutes = require('./uploads');

const app = express();
const uploadDir = path.join(__dirname, 'uploads'); // must exist
app.use(uploadRoutes({ requireUser: yourAuthMiddleware, uploadDir }));
app.use('/uploads', express.static(uploadDir, { setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff') }));
```

Your auth middleware must reject anonymous requests and set the user on the request (the router reads req.user). For cookie sessions, also check a CSRF token (the editor can send it with `requestHeaders`).

Docs: https://froala.com/wysiwyg-editor/docs/sdks/nodejs/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage
