# Python: wysiwyg-editor-python-sdk

Part of the froala-uploads-and-storage skill. Verified against the 5.6.0 source (GitHub tag `v5.6.0` of `froala/wysiwyg-editor-python-sdk`). The package is **not on PyPI**; Froala's docs offer the GitHub archive. `S3.getHash` and the validation helpers were run under Python 3.11 with the `wand` import stubbed (ImageMagick was not installed); uploads were not run.

<!-- validate:skip -->
<!-- Server-language SDK names (PHP, Python, .NET, Java, Ruby) are not froala-editor APIs; they were verified against the 5.6.0 SDK sources instead. -->

## Install

Copy the `froala_editor` package folder from the `v5.6.0` tag into your project; the repository has no `setup.py` or `pyproject.toml`, so `pip install` from Git does not work. Every import of `froala_editor` imports `wand.image`, so **Wand and the ImageMagick library are required even for file uploads**.

```python
from froala_editor import File, Image, Video, S3
from froala_editor import DjangoAdapter, FlaskAdapter, PyramidAdapter
```

Flask, adapted from the SDK's `flask_examples/server.py` with an error status added:

```python
import json
from flask import request
from froala_editor import Image, FlaskAdapter

@app.route('/upload_image', methods=['POST'])
def upload_image():
    try:
        response = Image.upload(FlaskAdapter(request), '/public/')
    except Exception as e:
        return json.dumps({'error': str(e)}), 400
    return json.dumps(response)
```

## API (5.6.0)

| Call | What it does |
|---|---|
| `Image.upload(adapter, fileRoute, options=None)` | Saves to `Utils.getServerPath() + fileRoute + sha1(time).<client extension>`, then validates, deletes the file and raises `Exception` on failure. Returns `{'link': fileRoute + name}` |
| `File.upload(...)`, `Video.upload(...)` | Same with file or video defaults |
| `Image.delete(src)`, `File.delete(src)`, `Video.delete(src)` | `os.remove(Utils.getServerPath() + src)` |
| `Image.list(folderPath, thumbPath=None)` | Image manager list: `[{url, thumb, name}]`, type guessed from the file name |
| `S3.getHash(config)` | Dict `{bucket, region, keyStart, params}` for `imageUploadToS3`; policy expires after 5 minutes; `region` comes back as `s3-<region>` (`s3` for us-east-1) |

Adapters: `DjangoAdapter(request)`, `FlaskAdapter(request)`, `PyramidAdapter(request)`, or subclass `BaseAdapter` and implement `getFilename`, `getMimetype` and `saveFile`.

Options: `fieldname` (default `'file'`), `validation` (a dict with `allowedExts` and `allowedMimeTypes`, or a function `(filePath, mimetype)` returning a boolean), `resize` (images, passed to Wand's `transform(resize=...)`). Image defaults: `gif jpeg jpg png svg blob`; file: `txt pdf doc`; video: `mp4 webm ogg`.

## Behaviour to know

- **Files are saved relative to `sys.argv[0]`**, the directory of the started script. Under gunicorn or uWSGI that can be the server's own directory (for example `venv/bin`), not your app. Test where files land in your deployment.
- **Validation trusts the client:** `mimetype` comes from the request (`request.files[...].content_type`) and the extension from the client's file name (run: `isFileValid('evil.png', 'image/png', ...)` returns `True` without reading the file). SVG is allowed by default.
- **No size limit**; set Flask's `MAX_CONTENT_LENGTH` or Django's upload limits and check the size in a validation function.
- **`delete(src)` concatenates `src`** onto the server path. Validate it first.
- `S3.getHash` reads `config['region']` and builds the policy exactly like the Node SDK (verified output shape).

<!-- validate:end -->

Docs: https://froala.com/wysiwyg-editor/docs/sdks/python/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage
