---
type: llm
---

PASS if the answer attaches Tribute to `editor.el` inside the `initialized` event, binds a `keydown` handler with `editor.events.on('keydown', fn, true)` (the `true` makes it run before Froala's own Enter handling) that returns `false` when `e.which === FroalaEditor.KEYCODE.ENTER` and `tribute.isActive`, and inserts the mention as a `<span class="fr-deletable" contenteditable="false">` from `selectTemplate`, with names escaped.
FAIL if it suggests disabling Enter globally, an invented Froala mentions plugin or option, a jQuery API, an arrow function that relies on `this` being the editor, or binding the handler without the `true` argument and without explaining the order problem.
