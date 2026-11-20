---
type: llm
---

PASS if the answer says the jQuery API was removed in Froala v3, rewrites the snippet as `new FroalaEditor('#editor', { toolbarButtons: [...], events: { contentChanged: function () { save(this.html.get()); } } })` or equivalent, and does not tell the user to add jQuery.
FAIL if it keeps `$(...).froalaEditor`, keeps the `froalaEditor.` event prefix, or uses an arrow function where `this` must be the editor.
