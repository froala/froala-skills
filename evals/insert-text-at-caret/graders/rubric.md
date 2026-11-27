---
type: llm
---

PASS if the answer explains that focusing the other input moves the selection out of the editor, saves the editor selection (for example `this.selection.save()` in the `blur` event) and calls `editor.selection.restore()` before `editor.html.insert(...)`, escapes the plain-text input before inserting it as HTML, and calls `editor.undo.saveStep()` afterwards so `contentChanged` fires.
FAIL if it inserts unescaped user input, uses a jQuery API, invents a method (for example `editor.text.insert` or `editor.insertText`), or only suggests `editor.events.focus()` without restoring the saved selection.
