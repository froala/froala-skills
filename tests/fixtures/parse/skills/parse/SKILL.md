---
name: parse
description: Fixture skill for the validator tests.
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-20"
---

A missing comma (an error on the line of the problem):

```js
const editor = new FroalaEditor('#e', {
  heightMin: 200
  toolbarInline: true,
});
```

Module syntax, top-level await and `import.meta` parse:

```js
import FroalaEditor from 'froala-editor';
const res = await fetch('/config');
new FroalaEditor('#e', { key: import.meta.env.VITE_FROALA_KEY, heightMin: (await res.json()).height });
export default FroalaEditor;
```

Sloppy-mode script syntax parses too (as a classic script):

```javascript
var x = 010;
```

An options fragment parses as the body of an object literal:

```js
heightMin: 200,
events: {
  initialized() {},
},
```

A WRONG / RIGHT pair that redeclares a name (an error):

```js
// WRONG
import { FroalaEditor } from 'froala-editor';
// RIGHT
import FroalaEditor from 'froala-editor';
```

The same pair marked as an intentional fragment:

```js fragment
// WRONG
import { FroalaEditor } from 'froala-editor';
// RIGHT
import FroalaEditor from 'froala-editor';
```

JSX in a block labelled js is not parsed; HTML inside strings does not count as JSX:

```js
const view = <FroalaEditorComponent tag="textarea" />;
```

```js
const html = '<p>Hello</p>';
const broken = ;
```

JSON blocks must parse; a fragment of members is checked as the body of an object:

```json
{ "froala-editor": "VERSION", }
```

```json
"allowedCommonJsDependencies": ["froala-editor"]
```

Code inside validate:skip is not parsed:

<!-- validate:skip -->
```js
this is not javascript
```
<!-- validate:end -->

TypeScript is not parsed:

```ts
const n: number = 1;
```
