# PHP: froala/wysiwyg-editor-php-sdk

Part of the froala-uploads-and-storage skill. Verified by reading the 5.6.0 package source (Packagist dist, git tag `v5.6.0`). PHP was not available on the verification machine, so this SDK was **not run**; every name below is from the source.

<!-- validate:skip -->
<!-- Server-language SDK names (PHP, Python, .NET, Java, Ruby) are not froala-editor APIs; they were verified against the 5.6.0 SDK sources instead. -->

## Install

```bash
composer require froala/wysiwyg-editor-php-sdk
```

Requirements from `composer.json`: PHP >= 5.4, `ext-fileinfo`, `ext-imagick`. `lib/FroalaEditor.php` throws if either extension is missing.

With Composer, load `vendor/autoload.php` and use the namespaced classes (PSR-4 `FroalaEditor\` maps to `lib/FroalaEditor/`). The underscore aliases (`FroalaEditor_Image`) also autoload through PSR-0. The docs page's `require 'PATH_TO_FROALA_SDK/lib/froala_editor.php'` names a file that does not exist in 5.6.0; the file is `lib/FroalaEditor.php`.

```php
<?php
require __DIR__ . '/vendor/autoload.php';

try {
  $response = \FroalaEditor\Image::upload('/uploads/');
  header('Content-Type: application/json');
  echo json_encode($response); // {"link":"/uploads/<sha1>.<ext>"}
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
}
```

## API (5.6.0)

| Call | What it does |
|---|---|
| `Image::upload($fileRoute, $options = NULL)` | Reads `$_FILES[fieldname]`, validates, then `move_uploaded_file` to `$_SERVER['DOCUMENT_ROOT'] . $fileRoute . sha1(microtime()) . '.' . <client extension>`. Returns an object with `link`. Throws `Exception` on a bad field name or failed validation |
| `File::upload(...)`, `Video::upload(...)` | Same with file or video defaults |
| `Image::delete($src)`, `File::delete`, `Video::delete` | `unlink($_SERVER['DOCUMENT_ROOT'] . $src)` if the file exists |
| `Image::getList($folderPath, $thumbPath = null)` | Image manager list: `[{url, thumb, name}]` for files whose detected MIME type is an allowed image type. Throws if the folder does not exist. (PHP names it `getList`, not `list`.) |
| `S3::getHash($config)` | Returns a **JSON string** (not an array) for `imageUploadToS3` |

Options: `fieldname` (default `'file'`), `validation` (an array with `allowedExts` and `allowedMimeTypes`, or a `Closure($tmpName, $mimeType)` returning a boolean), and for images `resize` (an array with `columns`, `rows`, optional `filter`, `blur`, `bestfit`, applied with Imagick). Image defaults: extensions `gif jpeg jpg png svg blob`; file defaults: `txt pdf doc`; video defaults: `mp4 webm ogg`.

## Behaviour to know

- **MIME type is detected on the server** with `finfo` (better than the other SDKs), but the **extension comes from the client's file name** and is kept in the stored name.
- **SVG is allowed by default.** Remove it from `allowedExts` and `allowedMimeTypes` unless you sanitise SVGs.
- **No size check.** PHP's `upload_max_filesize` and `post_max_size` are the only limits; add a size check in a validation closure.
- **`delete($src)` concatenates `$src` onto the document root.** Accept only names your code generated (for example match `basename($src)` against a pattern) and check ownership.
- **`S3::getHash`** needs a `timezone` key (it calls `date_default_timezone_set($config['timezone'])`), accepts an optional `conditions` array that is appended to the policy and also copied key by key into `params`, signs a policy that **expires after 10 hours**, and returns `region` in the `s3.<region>` form. Return the string as is:

```php
<?php
require __DIR__ . '/vendor/autoload.php';
header('Content-Type: application/json');
echo \FroalaEditor\S3::getHash([
  'timezone' => 'UTC',
  'bucket' => getenv('S3_BUCKET'),
  'region' => getenv('S3_REGION'),
  'keyStart' => 'uploads/',
  'acl' => 'public-read',
  'accessKey' => getenv('AWS_ACCESS_KEY_ID'),
  'secretKey' => getenv('AWS_SECRET_ACCESS_KEY'),
]);
```

Because `conditions` entries are copied into `params`, an array condition such as `['content-length-range', 1, 5242880]` turns into form fields named `0`, `1` and `2`, which the policy does not list, and S3 rejects uploads with unlisted fields. To add a size limit in PHP, port the signer in s3-and-azure.md (same algorithm, the condition goes only into the policy) and test it against a real bucket. The 10-hour expiry is also much longer than needed; shorten it in your port.

Authenticate these scripts (session check) before calling the SDK; the SDK does no auth.

<!-- validate:end -->

Docs: https://froala.com/wysiwyg-editor/docs/sdks/php/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage
