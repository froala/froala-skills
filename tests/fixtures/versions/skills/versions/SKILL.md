---
name: versions
description: Fixture skill for the validator tests. 
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-20"
---

CDN: `https://cdn.jsdelivr.net/npm/froala-editor@5.5.0/js/froala_editor.pkgd.min.js`
cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/froala-editor/5.5.0/js/froala_editor.min.js`
npm: `npm install froala-editor@^5.5.0` and `froala-editor@~5.5.0` and `froala-editor@latest`

```json
{ "dependencies": { "froala-editor": "5.5.0" } }
```

Placeholders are fine: `froala-editor@VERSION`, `ajax/libs/froala-editor/X.Y.Z/`, `froala-editor@$(npm view x)`.

<!-- validate:skip -->
Before the upgrade: `froala-editor@4.0.0`.
<!-- validate:end -->
