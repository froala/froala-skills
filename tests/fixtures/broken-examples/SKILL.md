---
name: broken-examples
description: Fixture for the validator's negative tests. Every example below is wrong on purpose.
license: MIT
metadata:
  version: "0.0.0"
  verified_against: "froala-editor 5.5.0"
  last_validated: "2026-11-17"
---

# Broken examples (each must be reported)

```js
new FroalaEditor('#editor', {
  licenseKey: 'ABC',                       // NEG-1: intentionally invalid option used in code
  pluginsEnabled: ['image', 'notAPlugin'], // NEG-2: plugin that does not exist
  toolbarButtons: ['bold', 'aiAsist'],     // NEG-3: misspelled toolbar button
  aiAssistAutoComplete: true,              // NEG-4: option name from release notes, not in the package
  events: {
    'word.afterImprt'() {},                // NEG-5: misspelled event
    initialized() {
      this.html.nonexistentMethod();       // NEG-6: method that does not exist
    },
  },
});
```

CDN: `https://cdn.jsdelivr.net/npm/froala-editor@5.5.0/js/froala_editor.pkgd.min.js` <!-- NEG-7: hard-coded version -->
