---
description: "@mentions with Tribute.js. Enter must pick the user, not insert a paragraph, while the list is open: keydown handler registered first that returns false on FroalaEditor.KEYCODE.ENTER when tribute.isActive; attach in initialized; fr-deletable chips."
tags: [plugins]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

I added @mentions to our Froala editor with Tribute.js. The list of users pops up fine when I type @, but when I press Enter to choose a name, Froala starts a new paragraph and the name is never inserted. Clicking a name works. How do I fix Enter, and how should the inserted mention look so it's deleted as one piece?
