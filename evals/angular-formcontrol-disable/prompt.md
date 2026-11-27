---
description: In 5.6.0 the Angular directive's setDisabledState is empty, so FormControl.disable() does nothing. Fix is edit.off()/edit.on().
tags: [diagnosis, angular, "5.6"]
allowed_tools: [Read, Glob, Grep, Skill]
---

Angular 20 standalone app with angular-froala-wysiwyg 5.6.0. The editor is bound to a reactive FormControl with [froalaEditor] and formControlName. When I call this.form.get('body')?.disable() the editor stays fully editable. How do I make it read-only?
