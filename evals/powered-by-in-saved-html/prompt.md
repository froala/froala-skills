---
description: 5.6.0 appends a "Powered by Froala Editor" paragraph to html.get() without a key or with the trial key. Models don't know this.
tags: [diagnosis, licensing, "5.6"]
allowed_tools: [Read, Glob, Grep, Skill]
---

Since we upgraded to froala-editor 5.6.0, every article we save from the editor ends with <p data-f-id="pbf">Powered by Froala Editor</p>. It's in the database now. We're still on localhost in development. Where does it come from and how do we get rid of it?
