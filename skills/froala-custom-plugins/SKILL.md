---
name: froala-custom-plugins
description: >
  Use when building custom Froala plugins or toolbar extensions: a custom toolbar button, dropdown,
  popup panel, icon, keyboard shortcut, or a plugin with its own state and public methods. Activates on
  FroalaEditor.PLUGINS, RegisterCommand, DefineIcon, DefineIconTemplate, RegisterShortcut, initPopup,
  showPopup, hidePopup, popups.create, POPUP_TEMPLATES or button.buildList. NOT for listening to built-in
  editor events (froala-methods-and-events) or setting up the editor itself (froala-initialization-and-sdks).
license: MIT
metadata:
  version: "1.1.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-18"
---

# Froala Custom Plugins

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. A project that still calls `.froalaEditor()` on a jQuery object runs Froala 2: upgrading means switching to `new FroalaEditor(...)`. Names that start with `$` in the current API (`editor.$el`, the `$btn` passed to `refresh`, the `$popup` from `editor.popups.create`) are Froala's own DOM helpers, not jQuery: keep using them where the API hands them to you.

## Plugin Boilerplate

Every custom Froala plugin follows this structure:

```js
// Import Froala core before registering plugins
import FroalaEditor from 'froala-editor';

(function (FroalaEditor) {
  // 1. Register an icon for the toolbar button (pick ONE of the options below)

  // a) A built-in icon: SVG_KEY is a key of FroalaEditor.SVG, NAME is the Font Awesome name
  FroalaEditor.DefineIcon('myPluginIcon', { NAME: 'star', SVG_KEY: 'star' });

  // b) Your own SVG: pass only the path data in PATH (not a whole <svg> element).
  //    VIEWBOX is optional and defaults to '0 0 24 24'.
  // FroalaEditor.DefineIcon('myPluginIcon', {
  //   template: 'svg',
  //   PATH: 'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z',
  //   VIEWBOX: '0 0 24 24',
  // });

  // c) Several paths: use the svgMultiplePath template and put the <path> elements in PATHS
  // FroalaEditor.DefineIcon('myPluginIcon', {
  //   template: 'svgMultiplePath',
  //   PATHS: '<path d="M4 4h16v2H4z"/><path d="M4 10h10v2H4z"/>',
  // });

  // 2. Register the toolbar command
  FroalaEditor.RegisterCommand('myPlugin', {
    title: 'My Plugin',          // Tooltip text
    icon: 'myPluginIcon',        // Icon registered above
    plugin: 'myPlugin',          // Hides the button when the plugin is disabled
    focus: true,                 // Keep editor focused
    undo: true,                  // Allow undo/redo
    refreshAfterCallback: true,  // Refresh toolbar state after execution
    callback() {
      // `this` is the editor instance
      this.html.insert('<span class="my-custom-element">Custom content</span>');
    },
  });

  // 3. Define the plugin logic (optional — needed for state/popup management)
  FroalaEditor.PLUGINS.myPlugin = function (editor) {
    function _init() {
      // Called when the editor initializes. Set up listeners and state here.
      // Clean up anything you create when the editor is destroyed:
      editor.events.on('destroy', function () {
        // remove timers, observers, global listeners…
      });
    }

    return {
      _init,
      // Expose public methods callable via editor.myPlugin.doSomething()
      doSomething() {
        editor.html.insert('<p>Custom action executed</p>');
      },
    };
  };
})(FroalaEditor);
```

**Add to toolbar config:**

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'myPlugin'],
  // If the project sets pluginsEnabled, your plugin must be in the list too:
  // pluginsEnabled: ['image', 'link', 'myPlugin'],
});
```

`pluginsEnabled` is an allowlist. When it is set, a custom plugin that is not listed never starts, and `this.myPlugin` is `undefined` inside commands.

**Custom SVG icon renders empty?** You passed a whole `<svg>` element. The `svg` template only uses `PATH` (and optional `VIEWBOX`).

---

## Custom Dropdown Button

```js
FroalaEditor.RegisterCommand('myDropdown', {
  title: 'Insert Template',
  type: 'dropdown',
  icon: 'myPluginIcon',
  options: {
    template1: 'Newsletter Header',
    template2: 'Call to Action',
    template3: 'Footer Block',
  },
  callback(cmd, val) {
    // `val` is the selected option key (e.g., 'template1')
    const templates = {
      template1: '<h2>Newsletter</h2><p>Issue content here...</p>',
      template2: '<div class="cta"><a href="#">Click Here</a></div>',
      template3: '<footer><p>Footer content</p></footer>',
    };
    this.html.insert(templates[val]);
  },
  refresh($btn) {
    // Called when toolbar state updates — use to enable/disable/highlight
  },
  refreshOnShow($btn, $dropdown) {
    // Called each time the dropdown opens
  },
});
```

---

## Custom Popup

Popups let you build floating UI panels (color pickers, link editors, etc.):

```js
// Style .my-plugin-layer in your own CSS. Inline style="" attributes and onclick="" handlers
// are blocked by a Content-Security-Policy that does not allow 'unsafe-inline'.

// 1. Register the popup template
FroalaEditor.POPUP_TEMPLATES['myPlugin.popup'] = '[_BUTTONS_][_CUSTOM_LAYER_]';

// 2. Define the plugin with popup management
FroalaEditor.PLUGINS.myPlugin = function (editor) {
  function initPopup() {
    const template = {
      buttons: '<div class="fr-buttons">' +
        editor.button.buildList(['myPluginClose']) +
        '</div>',
      custom_layer: '<div class="fr-layer fr-active my-plugin-layer">' +
        '<input class="my-plugin-input" type="text" placeholder="Enter value" aria-label="Value" />' +
        '<button type="button" class="my-plugin-apply">Apply</button>' +
        '</div>',
    };
    const $popup = editor.popups.create('myPlugin.popup', template);

    // Bind DOM events with editor.events.$on: Froala removes them when the editor is destroyed,
    // and no inline onclick is needed.
    editor.events.$on($popup, 'click', '.my-plugin-apply', function () {
      const value = $popup.find('.my-plugin-input').get(0).value;
      // Escape user input before inserting it as HTML
      const safe = String(value).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      editor.selection.restore();
      editor.html.insert(safe);
      hidePopup();
    });

    return $popup;
  }

  function showPopup() {
    let $popup = editor.popups.get('myPlugin.popup');
    if (!$popup) $popup = initPopup();
    editor.selection.save(); // inputs in the popup take focus away from the text

    // Position popup at current selection
    editor.popups.setContainer('myPlugin.popup', editor.$sc);
    const left = editor.$el.offset().left + editor.$el.outerWidth() / 2;
    const top = editor.$el.offset().top;
    editor.popups.show('myPlugin.popup', left, top, editor.$el.outerHeight());
  }

  function hidePopup() {
    editor.popups.hide('myPlugin.popup');
  }

  function _init() {}

  return { _init, showPopup, hidePopup };
};

// 3. Close button command
FroalaEditor.DefineIcon('myPluginClose', { NAME: 'times', SVG_KEY: 'back' });
FroalaEditor.RegisterCommand('myPluginClose', {
  title: 'Close',
  undo: false,
  focus: false,
  callback() {
    this.myPlugin.hidePopup();
  },
});

// 4. Trigger button that opens the popup
FroalaEditor.RegisterCommand('myPluginOpen', {
  title: 'Open My Panel',
  icon: 'myPluginIcon',
  undo: false,
  focus: false,
  callback() {
    this.myPlugin.showPopup();
  },
});
```

---

## State Synchronization

Keep custom plugin state in sync with the editor:

```js
FroalaEditor.PLUGINS.myPlugin = function (editor) {
  // Private state
  let _isActive = false;
  let _selectedItems = [];

  function _init() {
    // Listen to events to reset state when needed
    editor.events.on('contentChanged', function () {
      _validateState();
    });

    editor.events.on('blur', function () {
      _isActive = false;
    });
  }

  function _validateState() {
    // Check if cursor is inside a custom element
    const el = editor.selection.element();
    _isActive = el && el.classList.contains('my-custom-element');
  }

  function toggle() {
    if (_isActive) {
      _remove();
    } else {
      _insert();
    }
  }

  function _insert() {
    editor.html.insert('<span class="my-custom-element">Custom</span>');
    _isActive = true;
  }

  function _remove() {
    const el = editor.selection.element();
    if (el && el.classList.contains('my-custom-element')) {
      editor.selection.setAfter(el);
      el.parentNode.removeChild(el);
    }
    _isActive = false;
  }

  return { _init, toggle, isActive: () => _isActive };
};
```

**Refresh toolbar button to reflect active state:**

```js
FroalaEditor.RegisterCommand('myPlugin', {
  title: 'My Plugin',
  icon: 'myPluginIcon',
  callback() {
    this.myPlugin.toggle();
  },
  refresh($btn) {
    // Highlight button when active
    if (this.myPlugin.isActive()) {
      $btn.addClass('fr-active');
    } else {
      $btn.removeClass('fr-active');
    }
  },
});
```

---

## Registering Shortcut Keys

```js
FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.K, 'myPlugin', null, 'K');
```

---

## Loading Order

Plugins **and** commands must be registered **before** the editor is created:

- A command registered later has no button (the toolbar is already built).
- A plugin registered later never starts, so `this.myPlugin` is `undefined` and the button "does nothing".

In bundler environments, import your plugin file before creating the editor instance:

```js
import 'froala-editor';
import './my-froala-plugin'; // registers via side effects
import FroalaEditorComponent from 'react-froala-wysiwyg';
```
