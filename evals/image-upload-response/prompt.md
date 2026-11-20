---
description: Server response shape for image uploads is JSON with a `link` field; errors surface through the image.error event.
tags: [uploads]
allowed_tools: [Read, Glob, Grep, Skill]
---

I set imageUploadURL in Froala to my Express endpoint. The upload hits the server, but the image never appears in the editor. What exactly must my endpoint return, and how can I see why it fails?
