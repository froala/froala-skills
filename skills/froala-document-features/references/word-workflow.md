# Word import → edit → export

End-to-end setup for the Import from Word and Export to Word plugins, with an optional server-side import. Checked with froala-editor 5.6.0 in Chromium, mammoth 1.11.0, html-docx-js 0.3.1, file-saver 2.0.5, and for the server Express 5, multer 2.5.0 and sanitize-html 2.18.2.

## Browser (bundler)

```js
import FroalaEditor from 'froala-editor';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';     // includes import_from_word and export_to_word
import mammoth from 'mammoth';
import htmlDocx from 'html-docx-js/dist/html-docx';
import { saveAs } from 'file-saver';

window.htmlDocx = htmlDocx;                          // export reads these two globals
window.saveAs = saveAs;

const editor = new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', 'formatOL', 'formatUL', '|', 'import_from_word', 'export_to_word'],
  importFromWordMammoth: mammoth,
  importFromWordMaxFileSize: 3 * 1024 * 1024,
  wordExportFileName: 'proposal',
  events: {
    initialized() {
      // Observe or cancel exports without replacing Froala's own Word preparation:
      // registered first (third argument true), so Froala's handler still runs last.
      this.events.on('word.beforeExport', function () {
        if (!canExport()) return false;
      }, true);
    },
    'word.beforeImport'(file) {
      if (file.size === 0) return false;             // return false to cancel
    },
    'word.afterImport'() {
      saveDraft(this.html.get());                    // import saves an undo step, so contentChanged also fires
    },
  },
});

// Open a .docx as the whole document (import inserts at the cursor otherwise)
async function openDocx(file) {
  editor.html.set('');
  await editor.importFromWord.import(file);
}

// Save the edited document as .docx (same as the toolbar button)
function downloadDocx() {
  editor.exportToWord.export();
}

function canExport() { return true; }
function saveDraft(html) { /* send to your API */ }
```

Notes:

- `editor.importFromWord.import()` without a file opens the file picker. Dropping a `.docx` on the editor also imports it (`importFromWordEnableImportOnDrop`, default `true`, not on mobile).
- Exported images must be data URIs; images referenced by URL are not embedded.
- The exported `.docx` stores HTML in an altChunk part. Microsoft Word opens it; mammoth.js, LibreOffice and Google Docs do not read it, so a Froala export cannot be imported back by Froala. Keep the HTML (`editor.html.get()`) as the stored document.

## Server-side import (optional)

Use this when you don't want mammoth.js in the browser bundle, need a larger file limit, or want to sanitize imported HTML centrally. Set `importFromWordUrlToUpload: '/api/word-import'`; Froala then skips mammoth.js, POSTs the file as multipart field `file`, and inserts `html` from the JSON response. A response without `html`, or an error status, shows "Something went wrong. Please try again."

<!-- validate:skip -->
```js
// word-import.js — npm install express multer mammoth sanitize-html
const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const sanitizeHtml = require('sanitize-html');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 } }); // match importFromWordMaxFileSize

// Froala posts the file as multipart field "file" and reads { html } from the JSON response.
app.post('/api/word-import', /* yourAuth, */ upload.single('file'), async (req, res) => {
  if (!req.file || !/\.docx$/i.test(req.file.originalname)) return res.status(400).json({ error: 'Upload a .docx file' });
  try {
    const { value } = await mammoth.convertToHtml({ buffer: req.file.buffer });
    const html = sanitizeHtml(value, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
      allowedSchemesByTag: { img: ['data'] }, // mammoth embeds images as data: URIs
    });
    res.json({ html });
  } catch (err) {
    res.status(422).json({ error: 'Could not read this document' });
  }
});

app.listen(process.env.PORT || 3000);
```
<!-- validate:end -->

The request uses the browser's default `fetch` credentials (same-origin cookies); Froala sends no custom headers, so authenticate with your session cookie. Use mammoth 1.11.0 or newer on the server too (advisory GHSA-rmjr-87wv-gf87).
