---
description: Old v2 jQuery snippet pasted by a user on Froala 5. Expected answer rewrites it with new FroalaEditor and no jQuery.
tags: [stale-patterns, upgrade]
allowed_tools: [Read, Glob, Grep, Skill]
---

I installed froala-editor 5.6.0 from npm and copied this from a tutorial, but nothing happens:

    $('#editor').froalaEditor({ toolbarButtons: ['bold', 'italic'] });
    $('#editor').on('froalaEditor.contentChanged', function (e, editor) { save(editor.html.get()); });

Fix it.
