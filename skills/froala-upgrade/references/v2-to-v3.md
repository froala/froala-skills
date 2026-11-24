# Froala 2 (jQuery) → Froala 3 and later

Sources: Froala's guides [Migrate from Version 2 to Version 3](https://froala.com/wysiwyg-editor/docs/migrate-from-v2/) and [Migrate from Version 2 to Version 4](https://froala.com/wysiwyg-editor/docs/migrate-from-version-2-to-version-4/), and a diff of the npm packages `froala-editor` 2.9.8 (the last 2.x release) and 3.2.7. Everything here also applies when going from 2.x straight to 5.x; then also read `v3-to-v4.md`, `v4-to-v5.md` and `5x-minor-releases.md`.

Old (v2) names below are documented only to find and replace them. They do not exist in Froala 3+.

## Licence

"You will need an active V3 key to use the V3 editor" (v2→v3 guide). Moving to 5.x needs a v5 key. Contact support@froala.com.

## Dependencies and files

| Version 2.9.8 (old) | Froala 3+ |
|---|---|
| `package.json` depends on `jquery` (>=1.11.0) and `font-awesome` (>=4.4.0) | No dependencies. Remove jQuery and Font Awesome unless the app itself uses them |
| Icons from Font Awesome (`iconsTemplate` default `'font_awesome'`) | SVG icons (`iconsTemplate` default `'svg'`) |
| Webpack `ProvidePlugin({ $: 'jquery', jQuery: 'jquery' })`, or `window.$ = $` in create-react-app (wrapper READMEs) | Not needed; remove |
| `js/froala_editor.pkgd.min.js` (editor + plugins) | Same file, plus a new `js/plugins.pkgd.min.js` / `css/plugins.pkgd.min.css` (all plugins without the core) |
| `js/third_party/image_aviary.min.js` (Aviary image editor; options `aviaryKey`, `aviaryOptions`, `aviaryScriptURL`) | Removed. 3.x ships `image_tui.min.js`; 5.2.0+ also ships Filerobot |
| `css/themes/red.css` | Removed. Themes in 3+: `dark`, `gray`, `royal` |
| — | New plugin files: `edit_in_popup.min.js`, `files_manager.min.js`, `trim_video.min.js`, `cryptojs.min.js` |

The "Edit in popup" feature moved into its own plugin file in v3, `js/plugins/edit_in_popup.min.js` (guide). It is inside the `pkgd` bundles.

## Initialization

<!-- validate:skip -->
```js
// Froala 2
$('.editor').froalaEditor({
  toolbarInline: true,
}).on('froalaEditor.contentChanged', function (e, editor) {
  save(editor.html.get());
});
```
<!-- validate:end -->

```js
// Froala 3+
const editor = new FroalaEditor('.editor', {
  toolbarInline: true,
  events: {
    contentChanged: function () {
      save(this.html.get()); // `this` is the editor
    },
  },
});
```

`new FroalaEditor(selector, options, callback)`: the third argument runs once the editor is initialized (guide). Methods and `editor.events.on()` are available inside it.

## Events

The v2→v3 guide says no event was renamed; only how you bind them changed.

| Version 2 (old) | Froala 3+ |
|---|---|
| `$el.on('froalaEditor.<name>', function (e, editor, p1, p2) {…})` | `events: { <name>: function (p1, p2) {…} }` in the options |
| Handler receives `(e, editor, …params)` | Handler receives `(…params)`; `this` is the editor |
| `$el.off('froalaEditor.<name>')` | `editor.events.off('<name>')` |
| Dynamic binding on the jQuery element | `editor.events.on('<name>', fn)`, after initialization (inside the init callback) |
| Wrapper configs: `events: { 'froalaEditor.focus': function (e, editor) {…} }` | `events: { focus: function () {…} }` |

So `froalaEditor.contentChanged` → `contentChanged`, `froalaEditor.image.uploaded` → `image.uploaded`, `froalaEditor.initialized` → `initialized`: drop the `froalaEditor.` prefix and the `(e, editor)` parameters, and use `this` for the editor. Arrow functions don't receive the editor as `this`; use `function () {}` handlers or keep a reference to the instance.

## Methods

The guide says no v2 method changed, only how you call them.

| Version 2 (old) | Froala 3+ |
|---|---|
| `$('.editor').froalaEditor('html.get')` | `editor.html.get()` |
| `$('.editor').froalaEditor('html.set', '<p>…</p>')` | `editor.html.set('<p>…</p>')` |
| `$('.editor').froalaEditor('destroy')` | `editor.destroy()` |
| `$('.editor').data('froala.editor')` (instance) | Keep the object returned by `new FroalaEditor(...)` |

## Global namespace (custom buttons and plugins)

In 2.9.8 the class is exposed as `$.FroalaEditor` and `$.FE`. From 3.x it is the global (UMD) or default export `FroalaEditor`.

| Version 2 (old) | Froala 3+ |
|---|---|
| `$.FroalaEditor.DefineIcon(…)` / `$.FE.DefineIcon(…)` | `FroalaEditor.DefineIcon(…)` |
| `$.FroalaEditor.RegisterCommand(…)` | `FroalaEditor.RegisterCommand(…)` |
| `$.FroalaEditor.DEFAULTS`, `$.FroalaEditor.PLUGINS`, `$.FroalaEditor.POPUP_TEMPLATES` | `FroalaEditor.DEFAULTS`, `FroalaEditor.PLUGINS`, `FroalaEditor.POPUP_TEMPLATES` |
| `$.FroalaEditor.VERSION` | `FroalaEditor.VERSION` |

Icons defined with a Font Awesome `NAME` only need an SVG icon in 3+ (the wrapper READMEs show `FroalaEditor.DefineIcon('insert', { NAME: 'plus', SVG_KEY: 'add' })`). Inside plugins, `editor.$el`, `editor.$box`, `$btn` and `$popup` are Froala's own DOM helpers: keep them. See the froala-custom-plugins skill.

## Toolbar

- **New toolbar structure.** `toolbarButtons` (and `toolbarButtonsMD`, `toolbarButtonsSM`, `toolbarButtonsXS`) accept groups — an array of arrays, or an object of named groups with `buttons`, `align` and `buttonsVisible`. The legacy flat array with `'|'` separators still works (guide).
- **Default toolbar** is now grouped: `moreText`, `moreParagraph`, `moreRich`, `moreMisc` (3.2.7 package).
- **Buttons:** the v2 `color` button (one popup with text/background tabs) was removed (guide; the `color` command is gone in 3.2.7). Use `textColor` and `backgroundColor`. <!-- validate:skip -->The `colorsDefaultTab` option went with it.<!-- validate:end -->
- **New buttons** (guide): `textColor`, `backgroundColor`, `moreText`, `moreParagraph`, `moreRich`, `moreMisc`. 3.2.7 also adds `formatOLSimple`, `insertFiles` (files manager) and others.

| v2 setting | Froala 3+ |
|---|---|
| `toolbarButtons: ['bold', 'italic', 'underline', '|', 'align', 'undo', 'redo', 'html']` | Still valid, or grouped: `toolbarButtons: [['bold', 'italic', 'underline'], ['align', 'undo', 'redo', 'html']]` |
| `'color'` in any toolbar list | `'textColor', 'backgroundColor'` |

## Options

The guide lists these options as changed "to allow more customization": `toolbarButtons`, `toolbarButtonsMD`, `toolbarButtonsSM`, `toolbarButtonsXS` (groups, above), and the emoticon, special-character and Font Awesome sets. In the 3.2.7 package:

- `emoticonsSet` became a list of **categories** (`{ id, name, code, emoticons: [...] }`) instead of a flat list of `{ code, desc }`.
- `specialCharactersSets` entries gained a `char` field for the category icon.
- `fontAwesomeSets` entries gained an `icon` field.

If the project overrides any of these, rewrite it in the new shape (copy the 3+ default from `js/plugins/emoticons.min.js` etc. as a model).

<!-- validate:skip -->
Options removed between 2.9.8 and 3.2.7 (package diff; they don't exist in Froala 3+): `aviaryKey`, `aviaryOptions`, `aviaryScriptURL`, `colorsDefaultTab`, `downloadCustomHeader`, `emoticonsStep`. Delete them.
<!-- validate:end -->

## Checklist

1. Remove jQuery-based initialization; create editors with `new FroalaEditor(...)` (or the v3+ wrapper).
2. Move event handlers into `events: {}`; drop the `froalaEditor.` prefix and the `(e, editor)` arguments.
3. Replace `.froalaEditor('module.method', …)` calls with `editor.module.method(…)`.
4. Replace `$.FroalaEditor` / `$.FE` with `FroalaEditor` in custom code; give custom icons an SVG.
5. Replace the `color` button; review overridden emoticon / special character / Font Awesome sets.
6. Remove the Aviary image editor and the `red` theme if used.
7. Remove jQuery and Font Awesome from the build if nothing else needs them.
8. Get a new licence key for the target major version.
