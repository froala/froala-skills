---
description: Inserting text from an outside input lands at the end of the document because the editor lost its selection. Expected fix is selection.save() on blur + selection.restore() before html.insert(), then undo.saveStep().
tags: [api]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

My page has a Froala editor and, next to it, a text input plus an "Insert" button. Users put the cursor somewhere in the editor, type a snippet into the input and click Insert. I call editor.html.insert(input.value), but the snippet always ends up in a new paragraph at the bottom instead of where the cursor was. How do I insert it at the cursor?
