# @mentions with Tribute.js

Part of the froala-custom-plugins skill (verified against froala-editor 5.6.0). Froala has no built-in plugin for @mentions in the content (the Collaboration plugin's `collabConfig.mentionableUsers` only covers @mentions inside comments; see froala-document-features). Its official example (https://froala.com/wysiwyg-editor/examples/tribute-js/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-custom-plugins) uses the Tribute.js library. The code below follows that example and was run in headless Chromium with froala-editor 5.6.0 and tributejs 3.5.3 (the version the example loads) and 5.1.3 (the latest on npm, published 2020); both behaved the same.

## Contents

- Setup
- Why the Enter handler is needed
- Removing a mention
- Loading users from a server
- Frameworks and cleanup

---

## Setup

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tributejs@3.5.3/dist/tribute.css">
<script src="https://cdn.jsdelivr.net/npm/tributejs@3.5.3/dist/tribute.min.js"></script>
<!-- Froala CSS/JS as usual; npm: npm install tributejs, then import Tribute from 'tributejs' -->

<div id="editor"><p>Hi</p></div>

<script>
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const tribute = new Tribute({
    values: [
      { key: 'Phil Heartman', value: 'pheartman' },
      { key: 'Gordon Ramsey', value: 'gramsey' },
    ],
    // Tribute's default list item renders the name as HTML: escape it
    menuItemTemplate(item) {
      return escapeHtml(item.original.key);
    },
    // The HTML inserted for a chosen user: one non-editable chip that Backspace removes in one go
    selectTemplate(item) {
      return '<span class="fr-deletable fr-tribute" contenteditable="false" data-user="' +
        escapeHtml(item.original.value) + '">@' + escapeHtml(item.original.key) + '</span>';
    },
  });

  new FroalaEditor('#editor', {
    events: {
      initialized() {
        const editor = this;
        tribute.attach(editor.el);

        // While the mention list is open, Enter picks a user instead of starting a new paragraph
        editor.events.on('keydown', function (e) {
          if (e.which === FroalaEditor.KEYCODE.ENTER && tribute.isActive) {
            return false;
          }
        }, true); // true: run before Froala's own Enter handling

        editor.events.on('destroy', function () {
          tribute.detach(editor.el);
        });
      },
    },
  });
</script>
```

Observed with this code: typing ` @Gor` opened the list with "Gordon Ramsey"; Enter inserted `<span class="fr-deletable fr-tribute" contenteditable="false" data-user="gramsey">@Gordon Ramsey</span>&nbsp;` and the caret stayed in the same paragraph; `contentChanged` fired.

- `tribute.attach(editor.el)` must run in `initialized`: `editor.el` doesn't exist before. In iframe mode `editor.el` is the iframe's `<body>`; that setup was not tested.
- Tribute needs a space (or the start of the line) before `@` by default (`requireLeadingSpace: true` in its source). Typing `Hi@Gor` opened nothing.
- Escape the names in both templates. Observed with a user named `Gordon <b>Ramsey</b>`: Tribute's default list item rendered the `<b>` as HTML (so a name holding markup or script runs in the page), and the escaped menuItemTemplate above showed it as text. The selectTemplate result is HTML too. The official example escapes neither, and its template closes the `<span>` with `</a>`; use `</span>`. The escaped menuItemTemplate drops Tribute's highlighting of the matched letters.
- Add `data-user` (or similar) so your server can find mentions in the saved HTML. Keep `data-*` attributes allowed: they are in the default `htmlAllowedAttrs`; if you set your own list, include them.
- Style `.fr-tribute` in your CSS, both in the editor and where content is displayed.

## Why the Enter handler is needed

Without the `keydown` handler, Enter reached Froala first: it split the paragraph and no mention was inserted. Observed: `<p>Hi @Gor</p><p>&nbsp;thanks</p>`. With the handler (registered with the third argument `true`, so it runs before Froala's own handlers) Enter was left to Tribute. If you also handle Tab or arrow keys, check `tribute.isActive` the same way.

## Removing a mention

`contenteditable="false"` keeps users from editing inside the name; the `fr-deletable` class lets Backspace remove the whole chip. Observed: after the mention, one Backspace per character deleted the typed text and the trailing space, and the next Backspace removed the entire `<span>`. A `contenteditable="false"` element without `fr-deletable` was **not** removed by Backspace.

## Loading users from a server

Tribute also accepts a function for `values`; call its callback with the matches:

```js
const tribute = new Tribute({
  values(text, cb) {
    fetch('/api/users?q=' + encodeURIComponent(text))
      .then((r) => r.json())
      .then((users) => cb(users.map((u) => ({ key: u.name, value: u.id }))))
      .catch(() => cb([]));
  },
  menuItemTemplate(item) { /* as above */ },
  selectTemplate(item) { /* as above */ },
});
```

Observed with a stubbed `/api/users`: the list showed the returned names and Enter inserted the chip with `data-user` set to the user's `id`.

Debounce the request in production. Check the user list on the server when you save: the HTML from the browser can be edited.

## Frameworks and cleanup

- Create the `Tribute` instance once per editor, attach it in the wrapper's `config.events.initialized`, and detach it on `destroy` as above (observed: no errors after `editor.destroy()` with the detach handler).
- In React the wrapper reads `config` once, so create the Tribute instance outside render (module scope or a ref). Not run in a React app for this file.
- Load `tribute.css` for the list's default look.
