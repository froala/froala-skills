---
name: froala-uploads-and-storage
description: >
  Use when building or configuring where the Froala WYSIWYG rich text editor stores images, files and
  videos: the upload endpoint and its { "link": ... } response, the official server SDKs
  (wysiwyg-editor-node-sdk, PHP, Python, .NET, Java, Ruby), direct browser uploads to S3 or Azure Blob
  with server-side signing, deleting stored files when content is removed, and the image manager.
  Activates on imageUploadURL, imageUploadParam, imageUploadParams, imageMaxSize,
  imageAllowedTypes, fileUploadURL, fileAllowedTypes, videoUploadURL, imageUploadToS3, fileUploadToS3,
  videoUploadToS3, imageUploadToAzure, requestHeaders, requestWithCredentials, image.uploaded,
  image.removed, image.replaced, file.unlink, video.removed, imageManagerLoadURL or
  imageManagerDeleteURL. NOT for diagnosing an upload that already fails (froala-error-diagnosis)
  or for Filestack (froala-filestack-integration).
license: MIT
metadata:
  version: "1.2.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-25"
---

# Froala Uploads and Storage

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. Names that start with `$` in the current API (`editor.$el`, the `$img` passed to image events) are Froala's own DOM helpers, not jQuery.

This skill covers **building** upload and storage. If uploads already fail ("No link in upload response.", broken images after reload), use froala-error-diagnosis. For Filestack, use froala-filestack-integration.

Everything here was checked against `froala-editor` 5.6.0 and the 5.6.0 server SDKs, and the browser behaviour was reproduced in headless Chromium. Read the installed version from `node_modules/froala-editor/package.json` first; if it is not 5.6.x, re-check the options against that version.

## Choose where files go

| Target | Options | When |
|---|---|---|
| Your server | `imageUploadURL`, `fileUploadURL`, `videoUploadURL` | Default. You control auth, validation and storage. |
| Amazon S3, directly from the browser | `imageUploadToS3`, `fileUploadToS3`, `videoUploadToS3` | Large files that should not pass through your server. Your server signs a short-lived policy. |
| Azure Blob Storage, directly | `imageUploadToAzure`, `fileUploadToAzure`, `videoUploadToAzure` | Same, with a short-lived SAS token. Not in the options docs or `index.d.ts`; read from the package. |
| Filestack | `filestackOptions` | See froala-filestack-integration. |
| Nothing | none | Demos only. Froala inserts temporary `blob:` URLs, which break after a reload. |

## The upload contract

**Request** (your server): a `multipart/form-data` request (`imageUploadMethod` / `fileUploadMethod` / `videoUploadMethod`, default `POST`) to the upload URL with:

- the file in the field named by `imageUploadParam` / `fileUploadParam` / `videoUploadParam` (default `file`),
- one form field per key of `imageUploadParams` / `fileUploadParams` / `videoUploadParams`,
- the headers in `requestHeaders`, and cookies on cross-origin requests only if `requestWithCredentials: true`.

**Response:** HTTP 2xx with JSON `{ "link": "https://cdn.example.com/a.png" }`. The `link` becomes the `src` (or `href` for files). Other keys become attributes: `{ "link": "...", "data-id": "42" }` inserts `<img src="..." data-id="42">`.

**Errors:** reply with a non-2xx status and a JSON body. The editor then fires `image.error` / `file.error` / `video.error` with `error.code` and the raw response:

| `error.code` | Meaning |
|---|---|
| 2 | 2xx response without `link` |
| 3 | Non-2xx status |
| 4 | Response is not valid JSON, or the request failed (network or CORS error) |
| 5 | Larger than `imageMaxSize` / `fileMaxSize` / `videoMaxSize` (checked in the browser) |
| 6 | Type not in `imageAllowedTypes` / `fileAllowedTypes` / `videoAllowedTypes` (checked in the browser) |

Full option tables, defaults and events: [references/upload-contract.md](references/upload-contract.md).

## Minimal client configuration

```js
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

new FroalaEditor('#editor', {
  imageUploadURL: '/api/uploads/image',
  fileUploadURL: '/api/uploads/file',
  imageUploadParams: { doc_id: '42' },            // extra multipart fields
  requestHeaders: { 'X-CSRF-Token': csrfToken },  // sent with every upload request
  imageMaxSize: 5 * 1024 * 1024,                  // checked in the browser only
  imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  fileAllowedTypes: ['application/pdf'],          // MIME types, unlike imageAllowedTypes
  events: {
    'image.error'(error, response) {
      console.error('Image upload failed', error.code, error.message, response);
    },
    'file.error'(error, response) {
      console.error('File upload failed', error.code, error.message, response);
    },
  },
});
```

`imageAllowedTypes` lists image subtypes (`'png'`, `'svg+xml'`), compared with the file's MIME type minus `image/`. `fileAllowedTypes` lists full MIME types (`'application/pdf'`); `['pdf']` rejects every PDF. The default `fileAllowedTypes` is `['*']`.

## The server endpoint

Write the endpoint yourself, or use an official SDK:

| Language | Package (5.6.0) | Reference |
|---|---|---|
| Node.js | `wysiwyg-editor-node-sdk` on npm | [server-sdk-node.md](references/server-sdk-node.md) |
| PHP | `froala/wysiwyg-editor-php-sdk` on Packagist | [server-sdk-php.md](references/server-sdk-php.md) |
| Python | GitHub `froala/wysiwyg-editor-python-sdk` (not on PyPI) | [server-sdk-python.md](references/server-sdk-python.md) |
| .NET, Java, Ruby | NuGet FroalaEditorSDK, GitHub jar, gem `froala-editor-sdk` | [server-sdk-dotnet-java-ruby.md](references/server-sdk-dotnet-java-ruby.md) |

**The SDKs are reference implementations, not hardened endpoints.** In all six 5.6.0 SDKs:

- the delete helpers join the `src` they receive onto a disk path, so validate `src` before calling them (Ruby uses only the base name);
- validation relies on the client's file name, and (Node, Python, Java, .NET) on the client's `Content-Type` (Ruby's MIME check never runs); Node stored a PHP script named `.png` and an SVG with an `onload` handler in testing;
- the default image extensions include `svg`, which can carry script when served from your domain;
- the Node SDK sets no size limit and depends on `busboy` 0.2 (via `dicer`, advisory GHSA-wm7h-9275-46v2: a crafted request crashes the process).

For Node, [server-sdk-node.md](references/server-sdk-node.md) has a tested Express 5 + multer 2 router that checks the file's first bytes, generates the name, limits the size and requires a signed-in user. Port the same rules to other languages.

## Direct to S3 or Azure

The browser uploads straight to the bucket. **The secret key never reaches the browser:** your server returns a policy signed for a few minutes.

```js
// One signed policy per kind: each one only accepts its own Content-Type prefix.
const getS3Config = (kind) => fetch(`/api/uploads/s3-config?kind=${kind}`, { credentials: 'same-origin' }).then((r) => r.json());

const editor = new FroalaEditor('#editor', {
  imageUploadToS3: await getS3Config('image'),
  fileUploadToS3: await getS3Config('file'),
  videoUploadToS3: await getS3Config('video'),
  events: {
    'image.uploadedToS3'(link, key, response) {
      console.log('Stored in S3 as', key);
    },
  },
});

// The signed policy expires after 5 minutes. Replace it before then.
setInterval(async () => {
  editor.opts.imageUploadToS3 = await getS3Config('image');
  editor.opts.fileUploadToS3 = await getS3Config('file');
  editor.opts.videoUploadToS3 = await getS3Config('video');
}, 4 * 60 * 1000);
```

**Lock the `Content-Type` in the policy.** The SDK signers allow any type, so a policy holder can store `text/html` in your bucket. Even `image/` admits SVG, and your server never sees the bytes of a direct upload, so serve the bucket from a separate domain or CDN with `X-Content-Type-Options: nosniff`. An Azure SAS can't restrict the type at all.

The server side (the SDK's `S3.getHash`, or a tested variant that adds a `Content-Type` prefix and a size limit), the S3 bucket CORS, the ACL caveat, and Azure with a server-generated SAS are in [references/s3-and-azure.md](references/s3-and-azure.md). Never pass `accessKey` in `imageUploadToAzure`: the editor then signs requests in the browser with your storage account key.

## Deleting stored files

Froala never deletes files on your server. It fires events you can act on:

| Event | Fires when | Argument |
|---|---|---|
| `image.beforeRemove` | Before an image is removed with the toolbar, `editor.image.remove()`, or Backspace/Delete while the image is selected. Return `false` to keep it. Deleting a text selection that contains the image fires only `image.removed`. | `$img` |
| `image.removed` | On the next `contentChanged`, for each image `src` that is gone | `$img` |
| `image.replaced` | After an image is replaced. The 3rd argument is the old `src` (5.5+) | `$img`, response, old `src` |
| `file.unlink` | On `contentChanged`, for each removed `a.fr-file` link | the `<a>` element |
| `video.removed` | On `contentChanged`, for each removed video | `$video` |

**Deleting the file inside `image.removed` loses data** (reproduced on 5.6.0):

1. **Undo restores a dead image.** After a delete in `image.removed`, Ctrl+Z puts the `<img>` back. It still displays from the browser cache, so nobody notices, but the saved HTML points to a file that now returns 404.
2. **`html.set()` does not reset the list.** After `html.set()` loads another document, the next edit fires `image.removed` for every image of the previous document, which may still be saved elsewhere.

**Recommended:** delete on the server when a document is saved: compare the uploads referenced by the previous and new HTML, and delete only files that no saved document references (soft-delete with a grace period if you keep revisions). If you must delete immediately, delete only files uploaded in the current session and accept the undo caveat. Both patterns, tested: [references/deleting-and-image-manager.md](references/deleting-and-image-manager.md).

## Image manager

Set `imageManagerLoadURL` to your endpoint; **the default is Froala's demo server** (`https://i.froala.com/load-files`). It must return an array of `{ "url": ..., "thumb": ... }` (`url` required; `tag` optional; other keys become `data-*` attributes). Deleting sends a form-encoded `src=<thumb>` (the thumbnail's URL, or `url` when there is no `thumb`; the full URL is in `data-url`), plus the other `data-*` values and `imageManagerDeleteParams`, to `imageManagerDeleteURL` after the editor's own `confirm()`, and your endpoint must answer with **exactly 200**; 204 fires `imageManager.error` code 21. `imageManager.beforeDeleteImage` can return `false` to cancel. Details: [references/deleting-and-image-manager.md](references/deleting-and-image-manager.md).

## Security checklist

- **Authenticate** every upload, delete, list and signing route. Same-origin uploads send cookies; for cross-origin endpoints set `requestWithCredentials: true` or send a token in `requestHeaders`. Add CSRF protection for cookie sessions.
- **Detect the type on the server** from the file's bytes. Never trust the file name, the `Content-Type`, or `imageAllowedTypes` / `imageMaxSize` (browser-only checks).
- **Generate the stored name** (for example a UUID plus an extension chosen from the detected type). Never use the client's name in a disk path.
- **Limit the size** on the server and in the S3 policy (`content-length-range`).
- **Don't accept SVG or HTML** unless you sanitise them or serve uploads from a separate domain. Serve uploads with `X-Content-Type-Options: nosniff`.
- **Validate `src` before deleting:** accept only names your server generated, and check ownership and remaining references.
- **CORS:** a cross-origin upload endpoint must allow your origin and every header in `requestHeaders`. With the default `requestWithCORS: true`, image manager requests add an `Access-Control-Allow-Origin` *request* header, so a cross-origin manager endpoint must also list `access-control-allow-origin` in `Access-Control-Allow-Headers`, or set `requestWithCORS: false`.
- **`requestHeaders` are also sent to S3 and Azure.** Don't put a bearer token there when uploading directly to a bucket.
- **Pin and audit SDK dependencies** (see each SDK reference).

## Gotchas in 5.6.0

- **No upload target means `blob:` URLs.** Without an upload URL, S3 or Azure option, images (and files, and videos) are inserted as temporary `blob:` URLs that break after a reload.
- **URL-inserted and pasted remote images are re-uploaded through Froala's proxy.** With `imageUploadRemoteUrls: true` (default), "Insert image by URL" fetches the image through `imageCORSProxy` (default `https://cors-anywhere.froala.com`) and uploads it to your target with a timestamp file name. Set `imageUploadRemoteUrls: false` to link the URL instead, or host your own proxy.
- **A single `.docx` never reaches `fileUploadURL`** when the Import from Word plugin is loaded (it is in the `pkgd` bundles): its `file.beforeUpload` handler imports the document into the editor instead. Set `importFromWordEnableImportOnDrop: false` to upload `.docx` files as attachments.
- **One file per upload.** `editor.image.upload(files)` uploads only `files[0]`. When inserting several images from code, insert one at a time: wait for `image.inserted` / `image.replaced` / `image.error`, then `editor.selection.setAfter(previous)`. `image.insert()` is asynchronous and drops the caret, so a loop inserts every image after the first at the start of the document.
- **The S3 key and Azure blob name contain the user's file name.** S3: `keyStart + timestamp + '-' + name`. Azure: just the name, so two users uploading `image.png` overwrite each other. Rename in `image.beforeUpload` ([s3-and-azure.md](references/s3-and-azure.md)).
- **Docs and package disagree on video defaults.** The 5.6.0 package uses `videoMaxSize: 52428800` (50 MB; the docs say 30 MB) and `videoAllowedTypes: ['mp4', 'webm', 'ogg', 'mp3', 'mpeg', 'url']` (the docs list three). Trust the package, and set both explicitly.
- **Saved HTML may contain the "Powered by" paragraph.** With no licence key or the trial key, 5.6.0 `html.get()` appends `<p data-f-id="pbf" …>Powered by <a …>Froala Editor</a></p>`. Set the `key` option before saving content, and don't let the save-time cleanup treat that paragraph as content.

## Verify it works

1. Upload an image. In the Network tab, the request is `multipart/form-data` with field `file` (or your `imageUploadParam`), your extra params and headers; the response is 2xx with `{"link": ...}`.
2. `editor.html.get()` contains that `link` as the `src`, not `blob:` or `data:`. Reload the page with the saved HTML: the image still loads.
3. Upload a text file renamed to `.png`, and an oversized file, straight to the endpoint (for example with `curl -F`). Both must be rejected by the server, not just by the editor.
4. Log `image.error` and confirm each server error shows a code and your JSON body.
5. Delete an image, then press Ctrl+Z. If your design deletes immediately, fetch the restored `src` with `cache: 'no-store'` and decide whether the 404 is acceptable; otherwise check that the file is deleted only after save.
6. Image manager: thumbnails come from your endpoint (not the demo server), and delete returns 200 and removes the file.
7. S3/Azure: the browser bundle and network log contain no secret key or account key; the S3 policy decodes to an expiry a few minutes ahead.

## References

- [references/upload-contract.md](references/upload-contract.md): every upload option with 5.6.0 defaults, request and response details, events and error codes
- [references/server-sdk-node.md](references/server-sdk-node.md): Node SDK API, its caveats, and a tested Express 5 + multer router
- [references/server-sdk-php.md](references/server-sdk-php.md), [references/server-sdk-python.md](references/server-sdk-python.md), [references/server-sdk-dotnet-java-ruby.md](references/server-sdk-dotnet-java-ruby.md)
- [references/s3-and-azure.md](references/s3-and-azure.md): signing on the server, bucket CORS, Azure SAS
- [references/deleting-and-image-manager.md](references/deleting-and-image-manager.md): delete-on-save, session-only immediate delete, image manager contract
- [references/skill-feedback.md](references/skill-feedback.md): if this skill's guidance turned out wrong, outdated or missing for your case
- Froala docs: https://froala.com/wysiwyg-editor/docs/concepts/image/upload/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage, https://froala.com/wysiwyg-editor/docs/concepts/image/delete/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage, https://froala.com/wysiwyg-editor/docs/concepts/image/manager/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage, https://froala.com/wysiwyg-editor/docs/sdks/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage
