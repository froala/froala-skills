---
description: "With no upload target Froala inserts temporary blob: URLs, which break after reload."
tags: [diagnosis, uploads]
allowed_tools: [Read, Glob, Grep, Skill]
---

Users paste and drop images into our Froala editor and they look fine. We save editor.html.get() to the database. After a page reload, every image is broken. We didn't configure anything for images. What's going on?
