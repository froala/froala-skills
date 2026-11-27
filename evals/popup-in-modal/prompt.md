---
description: Popups are appended to scrollableContainer ('body' by default), so in a scrolling Bootstrap modal they sit behind the modal or outside its focus trap. Fix is scrollableContainer on the positioned modal body.
tags: [diagnosis, positioning, "5.6"]
allowed_tools: [Read, Glob, Grep, Skill]
---

Froala 5.6.0 inside a Bootstrap 5 modal (modal-dialog-scrollable). When I click a link or an image in the editor, the edit popup either doesn't show up at all, or it appears somewhere off-screen and doesn't move when I scroll the modal body. Once, when it did show, I clicked into the URL field and my typing went into the document instead. How do I fix the popup position?
