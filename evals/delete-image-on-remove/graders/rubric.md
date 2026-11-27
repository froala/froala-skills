---
type: llm
---

PASS if the answer names the `image.removed` event (reading the `src` from the `$img` argument) and also handles replacements via `image.replaced` (its third argument is the old `src`), and warns that deleting immediately breaks undo: Ctrl+Z restores an `<img>` whose file is already gone. It should recommend a safer design such as deleting on save after checking that no saved document still references the file (or a soft delete), and say the server must validate the `src` and check ownership before deleting.
FAIL if it invents an event name (such as `image.deleted`, `image.delete` or `imageRemoved`), claims Froala deletes the file from the server by itself, or recommends deleting with no caveat about undo or references.
