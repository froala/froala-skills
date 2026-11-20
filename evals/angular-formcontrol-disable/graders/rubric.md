---
type: llm
---

PASS if the answer says `FormControl.disable()` has no effect on the editor because the wrapper doesn't implement disabling (its `setDisabledState` is empty), and makes it read-only by getting the editor instance (for example from the `froalaInit` output's `getEditor()` or `initialized` event) and calling `editor.edit.off()`, and `editor.edit.on()` to re-enable.
FAIL if it claims `disable()` should work and blames the user's code, or invents an input such as `[disabled]` or `readOnly` option on the directive.
