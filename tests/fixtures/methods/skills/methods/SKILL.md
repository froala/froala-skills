---
name: methods
description: Fixture skill for the validator tests. 
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-20"
---

```js
editor.events.bind('x', () => {});
editor.html.getMarkdown();
editor.events.off('contentChanged');
myEditor.html.nonexistentMethod();
this.editor?.undo.notThere();
getEditor()?.html.alsoMissing();
FroalaEditor.RegisterComand('x', {});
editor.text.get();
```

| v2 | v3 |
|---|---|
| `$el.off('froalaEditor.x')` | `editor.events.off('<name>')` |

Prose: `FroalaEditor.RegisterComand`, `events.blur()`, `html.getMarkdown`.
