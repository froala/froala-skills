# Upload contract: options, request, response, events

Part of the froala-uploads-and-storage skill. Defaults are read from the published `froala-editor` 5.6.0 package (`js/plugins/image.min.js`, `file.min.js`, `video.min.js`, `image_manager.min.js`, `froala_editor.min.js`). Where the options docs differ, the package wins, and the difference is noted.

## Contents

- Options by plugin
- Shared request options
- What the request contains
- What the response must contain
- Events
- Error codes
- Behaviour worth knowing

## Options by plugin

| Image (`image.min.js`) | File (`file.min.js`) | Video (`video.min.js`) | 5.6.0 default |
|---|---|---|---|
| `imageUpload` | `fileUpload` | `videoUpload` | `true` (show the upload layer) |
| `imageUploadURL` | `fileUploadURL` | `videoUploadURL` | `null` (no upload: `blob:` URLs) |
| `imageUploadParam` | `fileUploadParam` | `videoUploadParam` | `'file'` |
| `imageUploadParams` | `fileUploadParams` | `videoUploadParams` | `{}` |
| `imageUploadMethod` | `fileUploadMethod` | `videoUploadMethod` | `'POST'` |
| `imageMaxSize` | `fileMaxSize` | `videoMaxSize` | 10485760 / 10485760 / **52428800** (the docs say 30 MB for video) |
| `imageAllowedTypes` | `fileAllowedTypes` | `videoAllowedTypes` | `['jpeg','jpg','png','gif','webp']` / `['*']` / **`['mp4','webm','ogg','mp3','mpeg','url']`** (the docs list three) |
| `imageUploadToS3` | `fileUploadToS3` | `videoUploadToS3` | `false` |
| `imageUploadToAzure` | `fileUploadToAzure` | `videoUploadToAzure` | `false` (not in the options docs or `index.d.ts`) |

How the type lists are compared:

- `imageAllowedTypes`: the file's MIME type with `image/` removed (`png`, `jpeg`, `svg+xml`). `'svg'` never matches.
- `videoAllowedTypes`: the MIME type with `video/` removed (`mp4`, `webm`).
- `fileAllowedTypes`: the full MIME type (`'application/pdf'`), or `'*'` for any. `['pdf']` rejects every PDF (code 6).

These checks and the size limits run in the browser only. Repeat them on the server.

Image-only options that affect storage:

| Option | Default | Effect |
|---|---|---|
| `imageUploadRemoteUrls` | `true` | "Insert image by URL" and pasted `http` images are downloaded and uploaded to your target instead of being linked |
| `imageCORSProxy` | `'https://cors-anywhere.froala.com'` | The proxy used for that download. Requests go to `<proxy>/<image URL>`. Host your own, or set `imageUploadRemoteUrls: false` |
| `imagePaste` | `true` | Pasted images are uploaded like picked ones |

## Shared request options (core)

| Option | Default | Effect |
|---|---|---|
| `requestHeaders` | `{}` | Added to every upload request (server, **S3 and Azure**) and to image manager load/delete requests |
| `requestWithCredentials` | `false` | Sets `withCredentials` on upload and image manager requests, so cross-origin requests carry cookies |
| `requestWithCORS` | `true` | Image manager requests only: adds the request header `Access-Control-Allow-Origin: *`, which forces a CORS preflight on cross-origin endpoints |

TypeScript: `index.d.ts` 5.6.0 types `imageUploadToS3` as `object`, has `requestHeaders`, and has no `imageUploadToAzure`; pass Azure options through a cast.

## What the request contains

Your server (`imageUploadURL`), reproduced in Chromium:

- `multipart/form-data`, one file per request (`editor.image.upload(files)` uses `files[0]` only).
- Field `file` (or `imageUploadParam`) with the file. Images keep the user's file name; images that have no name (pasted, inserted by URL) get `<timestamp>.<subtype>`.
- One text field per `imageUploadParams` key, added before the file.
- Headers from `requestHeaders`. No credentials on cross-origin requests unless `requestWithCredentials: true`. Same-origin requests always send cookies.

S3 and Azure request shapes are in s3-and-azure.md.

## What the response must contain

- Status 200–299 (S3 and Azure: exactly 201).
- Body: JSON with `link`. Relative links (`/uploads/a.png`) are inserted as written.
- Every other key becomes an attribute of the inserted element: `{ "link": "/a.png", "data-id": "42", "title": "x" }` gives `<img src="/a.png" data-id="42" title="x">`. For files, the keys are added to the `<a>`.
- On failure, return a 4xx/5xx with a JSON body; it is passed to the error event as the second argument.

The response text is passed to `image.uploaded` (string, before parsing). Returning `false` from `image.uploaded` stops the insert.

## Events

| Event | Arguments | Notes |
|---|---|---|
| `image.beforeUpload` | `files`, `$img` being replaced | Return `false` to cancel. Fires before the size and type checks |
| `image.uploaded` | response text | Return `false` to stop the insert |
| `image.inserted` | `$img`, response | After the image loads |
| `image.replaced` | `$img`, response, old `src` | Old `src` since 5.5 |
| `image.uploadedToS3` | `link`, `key`, response XML | Return `false` to stop the insert |
| `image.uploadedToAzure` | blob URL **including the SAS token**, `undefined` (the SharedKey signature when `accessKey` is used), response | Don't log or store the first argument. The inserted `src` is the URL without the SAS |
| `image.error` | `{ code, message }`, response, `$img` | |
| `file.beforeUpload`, `file.uploaded`, `file.inserted`, `file.uploadedToS3`, `file.uploadedToAzure`, `file.error` | as for images, except: `file.beforeUpload(files)`, `file.inserted($a, response)`, `file.error(error, response)` | No `$img` argument |
| `video.beforeUpload`, `video.uploaded`, `video.inserted`, `video.replaced`, `video.uploadedToS3`, `video.uploadedToAzure`, `video.error` | as for images, except: `video.beforeUpload(files)`, `video.error(error, response)` | |

Deletion events (`image.beforeRemove`, `image.removed`, `file.unlink`, `video.beforeRemove`, `video.removed`) are in deleting-and-image-manager.md.

## Error codes

`image.error`, `file.error` and `video.error` use the same numbers (the messages below are the image plugin's; file and video say "File" / "Video" instead of "Image"):

| Code | Message | Cause |
|---|---|---|
| 1 | "Image cannot be loaded from the passed link." | The returned `link` does not load (for example 404). Also a 2xx JSON string such as `"error"`: `"error".link` is `String.prototype.link`, so it is not caught as code 2 |
| 2 | "No link in upload response." | 2xx JSON object without `link` (for example `{}`) |
| 3 | "Error during file upload." | Non-2xx status from your server |
| 4 | "Parsing response failed." | Not JSON; the request failed (network, CORS); or S3/Azure answered with anything other than 201 |
| 5 | "File is too large." | Over `imageMaxSize` / `fileMaxSize` / `videoMaxSize` |
| 6 | "Image file type is invalid." | Not in the allowed types |

## Behaviour worth knowing

- **No target:** without `imageUploadURL`, `imageUploadToS3` or `imageUploadToAzure`, images are inserted as `blob:` URLs (SVG as a data URI). Files and videos also get `blob:` URLs.
- **Upload starts after a local preview.** The editor first shows the image from a `blob:` URL with the `fr-uploading` class, then swaps in `link`. The preview's `error` also starts the upload, so a file whose bytes are not an image (a text file named `x.png` with type `image/png`) is still sent to your server: reject it there.
- **`.docx` and Import from Word:** when the Import from Word plugin is loaded and `importFromWordEnableImportOnDrop` is `true` (the default), it registers (on desktop browsers, not mobile) a `file.beforeUpload` handler that imports any single `.docx` into the editor and cancels the upload. No `file.*` event reaches your handlers. Set `importFromWordEnableImportOnDrop: false` to upload `.docx` files.
- **Renaming before upload** (unique names, or names without personal data): return `false` from `image.beforeUpload` and call `this.image.upload([new File([file], newName, { type: file.type })])`, guarding against re-entry. Tested with Azure in s3-and-azure.md.

Docs: https://froala.com/wysiwyg-editor/docs/concepts/image/upload/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage, https://froala.com/wysiwyg-editor/docs/options/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage, https://froala.com/wysiwyg-editor/docs/events/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage
