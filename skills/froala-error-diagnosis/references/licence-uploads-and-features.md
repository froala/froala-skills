# Licence notices, uploads, read-only and optional features

Part of the froala-error-diagnosis skill (verified against froala-editor 5.6.0). Start from the symptom index in that skill's SKILL.md. In CDN URLs, replace `VERSION` with the installed version.

## Contents

- Licence Notice or Banner Appears
- Image / File Upload Does Nothing or Fails Silently
- Images Disappear After Saving or Reloading
- Editor Stays Editable (Read-only Not Working)
- AI Buttons Only Show a "Terms" Popup
- Word Import or Export Does Nothing
- PDF Button Does Nothing

## Licence Notice or Banner Appears

**Symptom:** a licence notice appears under the editor or in the console. Up to 5.5.0 it is a red banner: "This is an unlicensed version of the Froala Editor. To use it legally, please obtain a valid license…". 5.6.0 replaced it with a short notice next to "Powered by Froala":

| Notice (5.6.0) | Meaning | Fix |
|---|---|---|
| The license key for Froala Editor is missing. | No key, or an empty key | Add the trial key `TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE` to evaluate, or your licence key |
| You are using a 30-day trial version of Froala Editor, which is not for production use. | The trial key is in use | Expected while evaluating. Set a licence key before production |
| The license key for Froala Editor is invalid. | Key issued for another domain, copied incorrectly, or a bad date | Check the whole key was copied and was issued for this domain |
| The license key for Froala Editor expired. | A term key more than 15 days past expiry, or a perpetual key older than this release | Renew, or contact Froala sales |

**Cause 1 — the option name is wrong.** The activation key goes in the `key` option. `licenseKey` is not a Froala option and has no effect.

**Cause 2 — the key is missing in the deployed build.** Environment variables are often set locally but not in the production build. Check that the variable is defined at build time (never log the key itself). Bundlers only expose prefixed variables to browser code: `import.meta.env.VITE_*` in Vite, `process.env.NEXT_PUBLIC_*` in Next.js. An unprefixed `process.env` variable is `undefined` in the browser, which gives exactly this notice.

**Cause 3 — the key does not cover this domain.** A key is issued for a domain and its subdomains. Check the domains of the licence, and remember that upgrading from an older major version to v5 needs a new key.

**Cause 4 — no key or the trial key during local development on 5.6.0+.** On `localhost`, 5.5.0 shows only a small "Powered by Froala" badge without a key. From 5.6.0, localhost shows the same notice as a live site and the console logs it too. With no key or the trial key, 5.6.0 also appends `<p data-f-id="pbf" …>Powered by <a …>Froala Editor</a></p>` to the HTML that `html.get()` returns (and to the React `model`). That paragraph is saved with the content and shown wherever the saved HTML is displayed. Set a licence key. `html.set()` removes the paragraph when content is loaded back into the editor, so opening and re-saving each affected document cleans it.

```js
new FroalaEditor('#editor', {
  key: import.meta.env.VITE_FROALA_KEY, // Vite; Next.js: process.env.NEXT_PUBLIC_FROALA_KEY. Never hardcode in public repos
});
```

Activation docs: https://froala.com/wysiwyg-editor/docs/activation/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-error-diagnosis

---

## Image / File Upload Does Nothing or Fails Silently

**Symptom:** Selecting a file does nothing, the upload never completes, or the image popup shows "No link in upload response.", "Parsing response failed." or "Error during file upload."

**Cause 1 — `imageUploadURL` not set.**
Without `imageUploadURL`, `imageUploadToS3` or `imageUploadToAzure`, Froala does not upload anything. It inserts the image as a temporary `blob:` URL (SVG files as a data URI). **Blob URLs only work in the current browser tab**, so saved content shows broken images after a reload or on another device. Set an upload URL for anything that is saved:

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

Any other shape fails the upload and fires `image.error` (`error.code` 2 = no `link` in the response, 3 = upload error such as an HTTP error status, 4 = the response is not valid JSON, or the request failed (network or CORS error; also a non-201 reply from S3 or Azure); 5 = file too large, 6 = type not allowed). Log it, and compare with the actual response in the Network tab:

```js
events: {
  'image.error'(error, response) {
    console.error(error.code, error.message, response);
  },
}
```

`file.error` and `video.error` work the same way for files and videos.

**Cause 3 — CORS.**
The upload endpoint must allow the origin making the request. Check browser console for CORS errors.

**Cause 4 — `image.beforeUpload` returns `false` unintentionally.**
If you intercept uploads and `return false` always (not just for custom upload paths), Froala cancels every upload.

---

## Images Disappear After Saving or Reloading

**Symptom:** images look fine while editing, but are broken after the content is saved and loaded again. The saved HTML contains `src="blob:…"`.

**Cause:** no upload is configured, so images were only kept as temporary blob URLs (Froala's FAQ: by default images are stored temporarily as a Blob in browser memory). Set `imageUploadURL` (or S3/Azure/Filestack) — see "Image / File Upload Does Nothing or Fails Silently" above. Existing content with `blob:` URLs cannot be recovered; the images must be uploaded again.

---

## Editor Stays Editable (Read-only Not Working)

**Symptom:** the editor should be read-only, but users can still type. In Angular, `FormControl.disable()` or `[disabled]` has no effect on the editor.

**Cause:** no wrapper has a read-only prop, and the Angular directive's `setDisabledState` is empty (5.6.0). Setting `contenteditable` on the element yourself is undone when the editor gets focus.

**Fix:** call `editor.edit.off()` (and `editor.edit.on()` to re-enable) through the editor instance (`getEditor()`, or `this` in `events.initialized`). It also disables the toolbar. See froala-methods-and-events.

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

## Word Import or Export Does Nothing

| Symptom | Cause | Fix |
|---|---|---|
| Import does nothing | mammoth.js missing, or loaded **after** the Froala plugin (the plugin reads `window.mammoth` when it loads) | Load mammoth first, or pass it: `importFromWordMammoth: mammoth` |
| Export shows an error popup | `window.htmlDocx` or `window.saveAs` missing when Export is clicked | Load `html-docx-js` and a FileSaver build that defines `window.saveAs`, or assign both globals |
| Exported file will not open in LibreOffice / Google Docs | `html-docx-js` output targets Microsoft Word | Convert on the server if other apps must open it |

---

## PDF Button Does Nothing

**Symptom:** the PDF button (`getPDF`, print plugin) is visible, but clicking it downloads nothing and shows no error.

**Cause:** the PDF export needs html2pdf.js. The print plugin reads `window.html2pdf` when the plugin loads (option `html2pdf`), and does nothing if it is missing.

**Fix:** load html2pdf.js **before** the Froala scripts, or pass the library as the `html2pdf` option. Verify by clicking the button and opening the downloaded PDF.
