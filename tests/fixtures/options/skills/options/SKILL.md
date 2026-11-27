---
name: options
description: Fixture skill for the validator tests. 
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-20"
---

```js
new FroalaEditor('#e', { heigth: 300, licenseKey: 'x', events: { 'word.afterImprt'() {}, initialized() {} } });
const editorOptions = { theme: 'dark', notAnOptionA: true };
new FroalaEditor('#e2', editorOptions);
const config = { heightMin: 100, notAnOptionB: 1 };
FroalaEditor.DEFAULTS.notAnOptionC = true;
editor.events.on('notAnEventX', () => {});
```

```jsx
<FroalaEditorComponent config={{ placeholderText: 'x', notAnOptionD: 1 }} />
```

```vue
<froala :config="{ heightMin: 100, notAnOptionE: true }" />
```

```js
aiAssistAutoComplete: true,
```
