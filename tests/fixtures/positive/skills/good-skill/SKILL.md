---
name: good-skill
description: Fixture skill for the validator tests. Activates on html.get, events.on, undo.saveStep, markdown.toggle, popups.create, button.buildList, events.bindClick, TinyMCE, import_from_word and froala_editor.pkgd.min.js.
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-20"
---

# Good examples (validator must exit 0)

See [the reference](references/extra.md) and `references/extra.md`. Docs: [options](https://froala.com/wysiwyg-editor/docs/options/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=good-skill#key).

CDN: `https://cdn.jsdelivr.net/npm/froala-editor@VERSION/js/froala_editor.pkgd.min.js`, cdnjs `ajax/libs/froala-editor/X.Y.Z/`.

Prose API names: `editor.html.get()`, `html.set`, `events.initialized`, `image.beforeUpload`, `markdown.getMarkdown`, `edit.off()`, `data.session_id`, `FroalaEditor.RegisterCommand`, `FroalaEditor.DEFAULTS.htmlAllowedTags`, `myPlugin`, `licenseKey` (wrong on purpose, allowed in prose).

```js title="editor.js" {1}
const editor = new FroalaEditor('#editor', {
  key: 'LICENSE',
  heightMin: 200,
  toolbarButtons: [['bold', 'italic'], ['undo', 'redo', '|', 'myBtn']],
  toolbarButtonsXS: { moreText: { buttons: ['bold', 'italic'], align: 'left', buttonsVisible: 2 }, moreMisc: { buttons: ['undo'] } },
  pluginsEnabled: ['image', 'markdown', 'myPlugin', 'allowedPluginName'],
  importFromWordMammoth: window.mammoth,
  events: {
    initialized() {
      this.html.set('<p>Hi</p>');
      this.undo.saveStep();
      this.markdown.toggle();
    },
    'image.beforeUpload'(files) {},
    contentChanged() {
      const html = editor.html.get();
      editor.image.insert('x.png');
      editor.markdown.getMarkdown();
      editor.selection.text();
      editor.edit.off();
      editor.events.bindClick(document.body, 'button', () => {});
      editor.button.buildList(['bold', 'italic']);
      editor.popups.create('myPlugin.popup', {});
      editor.events.on('keyup keydown', () => {});
    },
  },
});
FroalaEditor.DefineIcon('myBtn', { NAME: 'star', template: 'svg', PATH: 'M0 0' });
FroalaEditor.RegisterCommand('myBtn', { title: 'Mine', callback() { this.myPlugin.run(); } });
FroalaEditor.PLUGINS.myPlugin = function (editor) { return { run() {} }; };
Object.assign(FroalaEditor.DEFAULTS, { myPluginColor: 'red' });
FroalaEditor.DEFAULTS.myPluginColor = 'blue';
const tags = FroalaEditor.DEFAULTS.htmlAllowedTags.concat(['x']);
// unrelated objects are not editor options
const options = { method: 'POST', headers: { 'content-type': 'application/json' } };
fetch('/save', options).then((res) => res.json()).then((data) => data.items.map((x) => x));
response.data.forEach(() => {});
```

~~~jsx
<FroalaEditorComponent tag="textarea" config={{ placeholderText: 'Type', charCounterMax: 100 }} />
~~~

```vue
<froala :config="{ toolbarInline: true, heightMin: 100 }" v-model:value="html" />
```

```json
{ "toolbarButtons": ["bold", "italic"], "dependencies": { "froala-editor": "VERSION" } }
```

<!-- validate:skip -->
Old code, deliberately wrong: `editor.events.bind()`, `froala-editor@4.0.0`.

```js
new FroalaEditor('#x', { notAnOption: true, toolbarButtons: ['notAButton'] });
```
<!-- validate:end -->
