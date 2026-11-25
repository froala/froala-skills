---
type: llm
---

PASS if the answer sets `enter: FroalaEditor.ENTER_BR` (the constant, value `2`), and mentions that it only changes typing: content loaded with `<p>` elements keeps them, and Shift+Enter already inserts `<br>` in every mode.
FAIL if it uses a string such as `enter: 'br'`, an invented option (for example `enterMode`, `forcedRootBlock` or `useBR`), a keydown handler instead of the option, or a jQuery API.
