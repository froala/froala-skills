---
description: html.set()/html.insert() don't fire contentChanged, so framework models miss API edits. Expected fix is undo.saveStep().
tags: [diagnosis]
allowed_tools: [Read, Glob, Grep, Skill]
---

In my Vue 3 app I use vue-froala-wysiwyg with v-model:value. When I call editor.html.insert('<p>Signature</p>') from a button, the text shows up in the editor but my v-model value never changes. Why, and how do I fix it?
