# Toolbar buttons: missing or doing nothing

Part of the froala-error-diagnosis skill (verified against froala-editor 5.6.0). Start from the symptom index in that skill's SKILL.md. In CDN URLs, replace `VERSION` with the installed version.

## Contents

- Toolbar Button Is Missing or Not Showing
- Toolbar Button Renders but Does Nothing
- Track Changes Buttons Missing

## Toolbar Button Is Missing or Not Showing

**Symptom:** You added a button name to `toolbarButtons` but it doesn't appear.

**Cause 1 — Plugin JS not imported.**
Toolbar buttons backed by a plugin (image, link, table, video, etc.) require the plugin's JS file to be imported first.

```js
// WRONG — button silently absent
new FroalaEditor('#editor', {
  toolbarButtons: ['insertImage'],
});

// CORRECT
import 'froala-editor/js/plugins/image.min.js';

new FroalaEditor('#editor', {
  toolbarButtons: ['insertImage'],
});
```

**Cause 2 — `pluginsEnabled` excludes the plugin.**
If `pluginsEnabled` is set, it acts as an allowlist — any plugin not listed is disabled even if imported.

```js
// WRONG — image plugin disabled
new FroalaEditor('#editor', {
  pluginsEnabled: ['link'],
  toolbarButtons: ['insertImage'], // silently gone
});

// CORRECT — include every plugin you need (names, not file names)
new FroalaEditor('#editor', {
  pluginsEnabled: ['link', 'image'],
  toolbarButtons: ['insertImage', 'insertLink'],
});

// OFTEN BETTER — keep everything except what you don't want
new FroalaEditor('#editor', {
  pluginsDisabled: ['emoticons'],
});
```

`pluginsEnabled` uses plugin names such as `importFromWord`, `aiAssist`, `track_changes` — not file names (`import_from_word.min.js`) and not button names (`import_from_word`). See `references/plugin-names.md`.

**Cause 3 — Wrong button name.**
Button names are case-sensitive and version-specific. Common correct names:

| Feature | Correct button name |
|---------|-------------------|
| Bold | `bold` |
| Italic | `italic` |
| Insert image | `insertImage` |
| Insert link | `insertLink` |
| Insert table | `insertTable` |
| Ordered list | `formatOL` |
| Unordered list | `formatUL` |
| Align left | `alignLeft` |
| Font size | `fontSize` |
| Text color | `textColor` |
| Clear formatting | `clearFormatting` |
| Full screen | `fullscreen` |
| HTML view | `html` |

**Cause 4 — Button missing from the toolbar group object (v4+).**
In Froala v4+, `toolbarButtons` can be a grouped object. Omitting a group means those buttons are never rendered.

```js
// WRONG — insertImage not in any group
toolbarButtons: {
  moreText: { buttons: ['bold', 'italic'] },
  // no moreRich group = insertImage never appears
}

// CORRECT
toolbarButtons: {
  moreText: { buttons: ['bold', 'italic'] },
  moreRich: { buttons: ['insertImage', 'insertLink', 'insertTable'] },
}
```

**Cause 5 — Custom command registered after the editor started.**
`FroalaEditor.RegisterCommand(...)` must run before `new FroalaEditor(...)`; the toolbar is built once, at start.

**Cause 6 — Plugin not in any `pkgd` bundle.** Check the "In pkgd" columns of `references/plugin-names.md`; for example `track_changes` and the `third_party` plugins must be loaded separately. Plugin names are in `references/plugin-names.md`.

---

## Toolbar Button Renders but Does Nothing

**Symptom:** the button is visible and clickable but has no effect.

**Cause 1 — the command's plugin never started.** The command was registered in time, but `FroalaEditor.PLUGINS.myPlugin` was defined after `new FroalaEditor(...)`, or `pluginsEnabled` does not list it. The callback then throws on `this.myPlugin.…` — check the console.

```js
// CORRECT — plugin and command both registered before the editor starts
FroalaEditor.PLUGINS.myPlugin = function (editor) { /* … */ return { _init() {} }; };
FroalaEditor.RegisterCommand('myBtn', { plugin: 'myPlugin', callback() { this.myPlugin.run(); } });
const editor = new FroalaEditor('#editor', { toolbarButtons: ['myBtn'] });
```

**Cause 2 — the callback is an arrow function.** `this` is not the editor. Use `callback() { … }`.

**Cause 3 — the callback throws.** Read the console; the error is usually logged on click.

**Cause 4 — a `commands.before` handler returns `false`.** That cancels the command. Return `false` only for the `cmd` you mean to block.

**Cause 5 — AI buttons:** see "AI Buttons Only Show a Terms Popup" in `licence-uploads-and-features.md`.

A command that is not registered, or whose plugin is left out of `pluginsEnabled`, is not rendered at all: see "Toolbar Button Is Missing" above.

---

## Track Changes Buttons Missing

**Symptom:** `trackChanges`, `showChanges`, `applyAll` or `removeAll` are in `toolbarButtons` but never render.

**Cause — `track_changes.min.js` is not in the `pkgd` bundles.** Load it separately.

```js
import 'froala-editor/js/plugins/track_changes.min.js';
```

With `pluginsEnabled`, its plugin name is `track_changes`. The same applies to every file marked "no" in `references/plugin-names.md`: `trim_video` also needs `css/plugins/trim_video.min.css`, and the `js/third_party/` plugins (`embedly`, `font_awesome`, `image_tui`, `imageFileRobot`, `spell_checker`) need their `css/third_party/<name>.min.css`.
