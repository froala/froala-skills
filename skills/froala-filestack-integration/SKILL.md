---
name: froala-filestack-integration
description: >
  Use when wiring Filestack into Froala for image, video or file uploads, or when replacing Froala's
  default uploader with a custom upload flow. Activates on filestackOptions, filestackAPI,
  uploadToFilestackOnly, pickerOptions, filestack.uploadedToFilestack, filestack.filestackPickerOpened,
  image.beforeUpload, file.beforeUpload, video.beforeUpload, image.insert, filestack-js or
  filestackcontent.com. NOT for server-side upload endpoints with imageUploadURL alone
  (froala-error-diagnosis covers upload failures).
license: MIT
metadata:
  version: "1.1.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-18"
---

# Froala + Filestack Integration

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. A project that still calls `.froalaEditor()` on a jQuery object runs Froala 2: upgrading means switching to `new FroalaEditor(...)`. Names that start with `$` in the current API (`editor.$el`, the `$btn` passed to `refresh`, the `$popup` from `editor.popups.create`) are Froala's own DOM helpers, not jQuery: keep using them where the API hands them to you.

## Two Approaches

| Approach | When to Use |
|----------|-------------|
| **Official Froala Filestack plugin** | Default — use when you want Froala's built-in Filestack support |
| **Manual interception** | Advanced — use when you need full custom control over the upload flow |

---

## Approach 1: Official Froala Filestack Plugin (Recommended)

Froala ships a native `filestack` plugin. This is the simplest and most supported path.

### Required Dependencies

Include all four scripts/stylesheets before Froala initializes:

```html
<!-- Filestack JS SDK: the Froala Filestack plugin docs use the 3.x.x line -->
<script src="https://static.filestackapi.com/filestack-js/3.x.x/filestack.min.js"></script>
<script src="https://static.filestackapi.com/filestack-drag-and-drop-js/1.1.1/filestack-drag-and-drop.min.js"></script>
<script src="https://static.filestackapi.com/transforms-ui/2.x.x/transforms.umd.min.js"></script>
<link rel="stylesheet" href="https://static.filestackapi.com/transforms-ui/2.x.x/transforms.css" />

<!-- Froala Filestack plugin: already in froala_editor.pkgd.min.js.
     Only load these if you use the core build (froala_editor.min.js). -->
<script src="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/js/plugins/filestack.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/plugins/filestack.min.css" />
```

Replace `VERSION` with the installed `froala-editor` version and use the same version in every URL — unversioned or `@latest` URLs can serve cached older files.

**Using a bundler instead of the CDN scripts?** The official plugin calls the globals `filestack`, `filestackDnD` and `FilestackTransform` when the editor starts. Either keep the Filestack CDN scripts in the page, or assign the same globals on `window` before creating the editor.

### Configuration

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'insertImage', 'insertFile', 'insertVideo'],

  filestackOptions: {
    filestackAPI: 'YOUR_FILESTACK_API_KEY',       // Required
    uploadToFilestackOnly: false,                  // true = disable Froala's own uploader
    pickerOptions: {},                             // Filestack Picker config options
  },

  events: {
    'filestack.uploadedToFilestack'(response) {
      console.log('Upload success:', response);
    },
    'filestack.uploadFailedToFilestack'(response) {
      console.error('Upload failed:', response);
    },
    'filestack.filestackPickerOpened'(response) {
      console.log('Picker opened');
    },
    'filestack.filestackPickerClosed'(response) {
      console.log('Picker closed');
    },
  },
});
```

**Do not set `pluginsEnabled: ['filestack']`.** `pluginsEnabled` is an allowlist — listing only `filestack` disables every other plugin, so image, link, table and the rest of the toolbar silently disappear. Omit it entirely unless you intend to restrict the plugin set.

### Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filestackOptions.filestackAPI` | String | `""` | Your Filestack API key |
| `filestackOptions.uploadToFilestackOnly` | Boolean | `false` | When `true`, disables Froala's native uploader — all uploads go through Filestack |
| `filestackOptions.pickerOptions` | Object | `{}` | Passed directly to the Filestack File Picker |

### Plugin Events

| Event | Triggered when |
|-------|----------------|
| `filestack.uploadedToFilestack` | File successfully uploaded to Filestack |
| `filestack.uploadFailedToFilestack` | File upload to Filestack fails |
| `filestack.filestackPickerOpened` | Filestack Picker UI opens |
| `filestack.filestackPickerClosed` | Filestack Picker UI closes |

---

## Approach 2: Manual Interception (Advanced)

Use this when you need custom upload logic not covered by the official plugin — e.g., applying transformations before insert, custom picker behavior, or using Filestack JS 4.x.

### Vanilla JS

```html
<script src="https://static.filestackapi.com/filestack-js/4.x.x/filestack.min.js"></script>

<script>
  const fsClient = filestack.init('YOUR_FILESTACK_API_KEY');

  new FroalaEditor('#editor', {
    events: {
      'image.beforeUpload'(files) {
        const editor = this; // the editor instance (method shorthand keeps `this`)
        const list = Array.from(files); // a drop can contain several files
        const replacing = editor.image.get(); // set when the user replaces an existing image

        (async () => {
          // Upload in order and insert in the same order. Only the first file may replace an image.
          for (const [i, file] of list.entries()) {
            try {
              const result = await fsClient.upload(file);
              editor.image.insert(result.url, false, null, i === 0 ? replacing : null);
            } catch (err) {
              console.error(`Filestack upload failed for ${file.name}:`, err); // keep going with the rest
            }
          }
        })();

        return false; // Cancel Froala's own upload
      },
    },
  });
</script>
```

### React

```jsx
import FroalaEditorComponent from 'react-froala-wysiwyg';
import * as filestack from 'filestack-js';
import 'froala-editor/js/plugins/image.min.js';

const fsClient = filestack.init(process.env.REACT_APP_FILESTACK_API_KEY);

export default function FroalaWithFilestack({ onModelChange }) {
  const config = {
    events: {
      'image.beforeUpload'(files) {
        const editor = this; // `this` is the Froala editor instance inside function()
        const list = Array.from(files);
        const replacing = editor.image.get();

        (async () => {
          for (const [i, file] of list.entries()) {
            try {
              const result = await fsClient.upload(file);
              editor.image.insert(result.url, false, null, i === 0 ? replacing : null);
            } catch (err) {
              console.error(`Upload error for ${file.name}:`, err);
            }
          }
        })();

        return false;
      },
    },
  };

  return <FroalaEditorComponent tag="textarea" config={config} onModelChange={onModelChange} />;
}
```

### Applying Transformations Before Insert

```js
fsClient.upload(file).then((result) => {
  const optimizedUrl = `https://cdn.filestackcontent.com/resize=width:800/output=format:webp/${result.handle}`;
  editor.image.insert(optimizedUrl, false, null, editor.image.get());
});
```

---

## Common Mistakes

| Problem | Cause | Fix |
|---------|-------|-----|
| Plugin does nothing | Using the core build without `js/plugins/filestack.min.js` | Use `froala_editor.pkgd.min.js`, or load the plugin JS and CSS |
| Every other toolbar button vanished | `pluginsEnabled: ['filestack']` set — it is an allowlist | Remove `pluginsEnabled` |
| Plugin broken / no picker UI | Different Filestack JS major version than the plugin docs use | Load `filestack-js` 3.x.x as in the plugin docs |
| No transforms/drag-drop UI | Missing CDN dependencies | Include all four scripts/stylesheets listed above |
| Image appears then disappears | Forgot `return false` in `image.beforeUpload` | Always `return false` to cancel Froala's upload attempt |
| Only one of several dropped images arrives | Handler used only `files[0]` | Iterate over every file (as above), or deliberately restrict selection to one file. Test a multi-file drop and a failed upload |
| `editor.image.get()` returns null | No image selected | Pass `null` as 4th arg to insert at cursor |
| `editor` is undefined in callback | Arrow function lost `this` context | Use `function()` not `() =>` for Froala event handlers |
| 403 on upload | Invalid API key or expired security policy | Verify key in Filestack Dashboard; regenerate policy if using security |
| Plugin fails only in a bundled app | `filestack`, `filestackDnD` or `FilestackTransform` globals missing | Keep the CDN scripts, or assign the globals on `window` before the editor starts |
| API key visible in the page | The Filestack API key is used in the browser | Enable Filestack's security policies (policy + signature) for production |
