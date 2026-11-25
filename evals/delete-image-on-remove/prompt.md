---
description: Deleting the stored file when an image is removed uses image.removed (and image.replaced), with the undo caveat; save-time cleanup is safer.
tags: [uploads, deletion]
allowed_tools: [Read, Glob, Grep, Skill]
---

Images uploaded through our Froala editor are stored on our server (imageUploadURL). When a user deletes an image in the editor, we want the file deleted from the server too, so we don't keep orphaned files. Which Froala event should we use, and is there anything to watch out for?
