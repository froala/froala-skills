---
name: fences
description: Fixture skill for the validator tests. 
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-20"
---

```js title="first.js"
const ok = 1;
```

Prose between fences with `notARealApiX` inline code.

```js
new FroalaEditor('#e', { toolbarButtons: ['notAButtonFence'] });
```

~~~ts
editor.html.notAMethodTilde();
~~~

````md
```js
nested fence is just text here: editor.html.notChecked();
```
````

```js
editor.events.notClosedMethod();
