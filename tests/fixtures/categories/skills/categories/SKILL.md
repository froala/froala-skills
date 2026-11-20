---
name: categories
description: Fixture skill for the validator tests. 
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-20"
---

Prose is fine: `onlyExternal`.

```js
new FroalaEditor('#e', {
  onlyExternal: true,
  toolbarButtons: ['onlyExternal'],
  pluginsEnabled: ['onlyExternal'],
  events: { onlyExternal() {} },
});
```
