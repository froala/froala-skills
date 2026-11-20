---
description: TinyMCE init mapped to Froala options, including the upload handler and content get/set.
tags: [migrate]
max_turns: 14
allowed_tools: [Read, Glob, Grep, Skill]
---

We want to replace TinyMCE with Froala. Convert this:

    tinymce.init({
      selector: '#body',
      plugins: 'lists link image table code',
      toolbar: 'undo redo | bold italic | bullist numlist | link image table | code',
      images_upload_url: '/upload',
      height: 400
    });
    const html = tinymce.get('body').getContent();
