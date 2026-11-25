---
description: Enter should insert <br> instead of <p>. Expected answer is enter: FroalaEditor.ENTER_BR (a constant, not a string), noting that existing <p> content is not converted.
tags: [options]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

We use Froala for short email signatures. When users press Enter, Froala wraps every line in its own <p>, which adds big gaps in Outlook. I want Enter to insert a plain line break instead. What option do I set?
