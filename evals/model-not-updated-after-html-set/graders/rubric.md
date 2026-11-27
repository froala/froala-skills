---
type: llm
---

PASS if the answer explains that `html.insert()` (and `html.set()`) don't fire the `contentChanged` event the wrapper listens to, and fixes it by calling `editor.undo.saveStep()` after the insert (or an equivalent documented approach).
FAIL if it blames Vue reactivity alone, suggests Vue 2 `v-model` syntax, or invents an event or method.
