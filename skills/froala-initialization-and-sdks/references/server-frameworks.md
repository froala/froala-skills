# Server frameworks and CMS packages

Part of the froala-initialization-and-sdks skill. Checked on 2026-11-25 against each package registry and the package source (froala-editor 5.6.0 is the current release). These packages were **not run** in an app for this file: install steps and names come from each package's README and source, and the source wins where the two disagree (noted below).

Every package here ships its own copy of the editor files. Keep that copy at the same version as anything else on the page; never mix it with a CDN `froala-editor` of another version.

## Contents

- Summary
- Ruby on Rails: `wysiwyg-rails`
- Django: `django-froala-editor`
- PHP and Laravel: `froala/wysiwyg-editor-php-sdk`
- WordPress: `wordpress-froala-wysiwyg`
- Symfony: `kms/froala-editor-bundle` (lags behind)
- Not covered

---

## Summary

| Stack | Package (registry) | Latest | Bundled editor | Source |
|---|---|---|---|---|
| Rails | `wysiwyg-rails` (RubyGems) | 5.6.0 (2026-11-18) | 5.6.0 | github.com/froala/wysiwyg-rails |
| Django | `django-froala-editor` (PyPI) | 5.6.0 | 5.6.0 | github.com/froala/django-froala-editor |
| PHP (uploads only) | `froala/wysiwyg-editor-php-sdk` (Packagist) | 5.6.0 | none (server helper) | github.com/froala/wysiwyg-editor-php-sdk |
| WordPress | not on wordpress.org; GitHub release `v5.6.0` | plugin header says 1.0.2 | 5.6.0 | github.com/froala/wordpress-froala-wysiwyg |
| Symfony | `kms/froala-editor-bundle` (Packagist) | v4.2.1 (2024-06-19) | downloads at install time | github.com/froala/KMSFroalaEditorBundle |

For any stack, plain npm or CDN loading (main skill) also works: the editor is a browser library, and the server only needs to store HTML and answer uploads.

**Upload response contract (every stack):** the editor posts the file in the field `file` (`imageUploadParam`, default `'file'`) to `imageUploadURL`, and expects JSON `{"link": "<url>"}`. Anything else fires `image.error`.

---

## Ruby on Rails: `wysiwyg-rails`

A Rails engine that puts the editor's JS and CSS on the asset pipeline. Gem 5.6.0 bundles froala_editor v5.6.0 (`app/assets/javascripts/froala_editor.min.js` header) and depends on `railties >= 3.2.7, < 9.0`.

```ruby
# Gemfile
gem "wysiwyg-rails", "5.6.0"
```

From the README (Sprockets):

```coffeescript
# app/assets/javascripts/application.js.coffee
#= require froala_editor.min.js
#= require plugins/link.min.js
#= require plugins/image.min.js
```

```scss
// app/assets/stylesheets/application.css.scss
@import "froala_editor.min";
@import "froala_style.min";
@import "plugins/image.min";   // a plugin's CSS, where it has one
```

Then `new FroalaEditor('#editor', { key: '…' })` in your page script. Languages: `#= require languages/de.js`; themes: `themes/dark.min.css`.

- The engine adds these to the Rails asset precompile list: `froala_editor.min.js`, `plugins/*.js`, `languages/*.js`, `froala_editor.min.css`, `froala_style.min.css`, `plugins/*.css`, `themes/*.css` (from `lib/wysiwyg-rails/engine.rb`). The gem also ships `froala_editor.pkgd.min.js` and `.css`, but they are **not** in that list: if you load them directly with a `<script>` tag, add them to that list yourself.
- The engine relies on the Sprockets asset pipeline. A Rails 7+ app on importmap or jsbundling without Sprockets can install `froala-editor` from npm instead (main skill).
- Uploads: write a controller that saves the file and renders `{ link: url }`. Froala's Ruby SDK for server-side upload helpers is the separate gem `froala-editor-sdk` (5.6.0 on RubyGems): https://froala.com/wysiwyg-editor/docs/sdks/ruby/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks (not run for this file).

## Django: `django-froala-editor`

A model field, form widget and upload views. 5.6.0 bundles froala_editor v5.6.0 under `froala_editor/static/froala_editor/`.

```bash
pip install django-froala-editor==5.6.0
```

```python
# settings.py
INSTALLED_APPS = [..., 'froala_editor']
FROALA_EDITOR_OPTIONS = {
    'key': os.environ.get('FROALA_KEY', ''),  # licence key: passed straight to the editor
    'heightMin': 300,
}

# urls.py (adds the image and file upload views)
from django.urls import include, path
urlpatterns = [..., path('froala_editor/', include('froala_editor.urls'))]

# models.py
from froala_editor.fields import FroalaField
class Page(models.Model):
    content = FroalaField()                       # or FroalaField(options={'toolbarInline': True}, theme='dark')

# forms.py
from django import forms
from froala_editor.widgets import FroalaEditor
class PageForm(forms.ModelForm):
    content = forms.CharField(widget=FroalaEditor(options={'heightMin': 300}))
```

Outside the admin, render `{{ form.media }}` in the template. The widget writes an inline `<script>new FroalaEditor('#id', {...})</script>` after the textarea, so a Content Security Policy without `'unsafe-inline'` blocks it.

What the source does (where it differs from the README, trust the source):

- Settings read by the package (widget, model field and upload views): `FROALA_EDITOR_OPTIONS` (merged under per-field `options`), `FROALA_EDITOR_PLUGINS`, `FROALA_EDITOR_THIRD_PARTY`, `FROALA_EDITOR_THEME`, `FROALA_UPLOAD_PATH`, `FROALA_STORAGE_BACKEND`, `FROALA_JS_COOKIE`, `USE_FROALA_EDITOR`. The README spells one of them `FRAOLA_EDITOR_THIRD_PARTY`; the code reads `FROALA_EDITOR_THIRD_PARTY`.
- Themes shipped: `dark`, `gray`, `royal` (the README's "red" does not exist).
- The README's form example uses forms.TextField, which is not a Django form field; use forms.CharField (as above).
- `FROALA_EDITOR_PLUGINS` is a list of **plugin file names** (each becomes `froala_editor/js/plugins/<name>.min.js`). The default list in 5.6.0 is 30 core plugins and leaves out newer ones such as Markdown, AI Assist, the Accessibility Checker, Paint Format and Word import/export. To use them, set the full list yourself, using the file names in `js/plugins/` (for example `markdown.min.js` → `'markdown'`).
- The plugins argument of FroalaField sets the plugins; it cannot set third-party plugins (use the setting).
- Uploads: the image and file upload views save with Django storage and return `{"link": …}`. They have **no authentication**, and the file view has no type check: anyone who can reach the URL can store files. Wrap them in your own views with Django's login_required decorator and your own checks, or leave `froala_editor.urls` out (uploads are then turned off: the widget sets `imageUpload: False` and `fileUpload: False`). The image view's only check is the MIME type the browser reports. The README's keyword arguments for turning image or file uploads off on FroalaField and FroalaEditor are accepted but never used by the 5.6.0 source, so they don't turn uploads off.

## PHP and Laravel: `froala/wysiwyg-editor-php-sdk`

There is no official Laravel package. The official PHP piece is the server SDK for uploads (5.6.0 on Packagist; requires PHP >= 5.4 with the `fileinfo` and `imagick` extensions). Load the editor itself from npm or the CDN.

```bash
composer require froala/wysiwyg-editor-php-sdk:5.6.0
```

```php
<?php
require 'vendor/autoload.php';

header('Content-Type: application/json');
try {
    // Path is relative to $_SERVER['DOCUMENT_ROOT'] and must end with '/'
    $response = \FroalaEditor\Image::upload('/uploads/');
    echo json_encode($response); // {"link":"/uploads/<sha1>.jpg"}
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
```

From the SDK source (`lib/FroalaEditor/Image.php`, `Utils/DiskManagement.php`): files are read from the `file` field, renamed to the SHA-1 of the current time (`sha1(microtime())`, so names are guessable, not random), and `upload()` throws on a validation failure. The default image validation allows `svg`; an uploaded SVG can carry script, so pass your own `validation` (`['allowedExts' => […], 'allowedMimeTypes' => […]]`) without SVG unless you sanitise it. Other classes: `FroalaEditor\File`, `FroalaEditor\Video`, `FroalaEditor\S3` (signature for direct S3 uploads).

In Laravel, a plain controller is enough: store `$request->file('file')` on a public disk and return `response()->json(['link' => $url])`. Protect the route with your auth middleware and include the CSRF token, for example with `imageUploadParams: { _token: '…' }` (the editor sends `imageUploadParams` with the upload). This Laravel code was not run for this file.

## WordPress: `wordpress-froala-wysiwyg`

Froala's plugin replaces the default editor in the admin area, with a settings page for the licence key and plugin choice, and a PHP API for the front end. The repository's `v5.6.0` release bundles froala_editor v5.6.0 (`admin/js/` and `public/js/`); the plugin header still says `Version: 1.0.2`.

Install: download the repository (https://github.com/froala/wordpress-froala-wysiwyg), copy it into a folder under `wp-content/plugins/`, and activate it. The docs page also mentions searching for it under Plugins → Add New, but on 2026-11-25 the wordpress.org plugin directory API returned no plugin for "froala", so install from GitHub.

Front end (from the README), in your theme:

```php
$froala = new Froala_Editor();
$froala->activate('#comment', array(
    'heightMin' => 200,
));
```

From `public/class-froala-public.php`: the options array is JSON-encoded into an inline script, `key` is always set from the licence key saved on the plugin's settings page (a `key` you pass is overwritten), and the editor is created in `window.onload = …`, which replaces any other `window.onload` handler on the page.

Hooks (WordPress plugin filters, not editor events): froala_before_public_init / froala_after_public_init (front end) and froala_before_init / froala_after_init (admin), applied with apply_filters() and the arguments `($path, $type 'js'|'css', $prop 'file'|'inline', $mix)`. Register them right after `new Froala_Editor()`. The README also defines constants for custom JS and CSS folders (FroalaCustomJSFolderPath, FroalaCustomCSSFolderPath).

How it coexists with the block editor (Gutenberg) was not checked; test on a staging site.

## Symfony: `kms/froala-editor-bundle` (lags behind)

Hosted under github.com/froala, published on Packagist as `kms/froala-editor-bundle`. The latest release is **v4.2.1 (2024-06-19)** and it requires `symfony/framework-bundle ^4.4|^5.0`, so it does **not** install on Symfony 6 or 7. On those versions, load the editor from npm (Webpack Encore or AssetMapper) and render a textarea yourself.

On Symfony 4.4/5.x (from the README):

```bash
composer require kms/froala-editor-bundle
bin/console froala:install --tag=v5.6.0   # downloads github.com/froala/wysiwyg-editor at that tag; default is master
bin/console assets:install --symlink public
```

```yaml
# config/packages/kms_froala_editor.yaml
kms_froala_editor:
    language: 'en'
    serialNumber: '%env(FROALA_KEY)%'   # rendered as the editor's `key` option
```

```php
use KMS\FroalaEditorBundle\Form\Type\FroalaEditorType;
$builder->add('content', FroalaEditorType::class, ['froala_heightMin' => 300]);
```

Form-type options are prefixed with `froala_`. The bundle's list of known options (`src/Utility/UConfiguration.php`) predates 5.x: options added since, such as `accessibilityCheckerLevel`, are not in it. The widget template loads `froala_editor.min.js` plus a plugin list; check the result in the browser.

## Not covered

No official, maintained Froala package was found for these, so they are not covered: Laravel (use the PHP SDK or a plain controller), Blazor (Froala documents .NET upload handlers only; load the editor with JS interop), Spring/Java (Java SDK for uploads only). The framework-plugins page also lists Yii, CakePHP and Craft CMS integrations; they were not checked for this file. List: https://froala.com/wysiwyg-editor/docs/framework-plugins/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks
