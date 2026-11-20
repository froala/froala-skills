---
name: toolbar
description: Fixture skill for the validator tests. 
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-20"
---

```js
new FroalaEditor('#e', {
  toolbarButtons: [['bold', 'italic'], ['notAButtonX']],
  toolbarButtonsMD: { moreText: { buttons: ['bold', 'notAButtonY'], align: 'left' }, moreRich: { buttons: ['insertLink'] } },
  pluginsEnabled: ['image', 'notAPlugin'],
});
editor.button.buildList(['bold', 'notAButtonZ']);
```

```json
{ "toolbarButtons": ["undo", "notAButtonJson"], "pluginsEnabled": ["notAPluginJson"] }
```
