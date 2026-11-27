# Content options: images, tables, links, Enter, fonts, code view

Part of the froala-methods-and-events skill (verified against froala-editor 5.6.0). Defaults are quoted from `FroalaEditor.DEFAULTS` in the 5.6.0 package, which wins where the options page differs. Results marked "observed" were reproduced in headless Chromium with the npm package. `html.get()` output below omits the "Powered by Froala Editor" paragraph that 5.6.0 appends without a licence key.

## Contents

- Images
- Tables
- Links
- Enter key: paragraphs, divs or line breaks
- Non-editable content and HTML handling
- Fonts, sizes, colours and styles
- Code view (HTML source)
- Clearing the undo history: `undo.reset()`

---

## Images

| Option | Default | Notes |
|---|---|---|
| `imageDefaultWidth` | `300` | Width in px given to inserted images; `0` keeps the natural size |
| `imageDefaultAlign` | `'center'` | `'left'`, `'center'`, `'right'` |
| `imageDefaultDisplay` | `'block'` | `'block'` or `'inline'` |
| `imageEditButtons` | `['imageReplace', 'imageAlign', 'imageCaption', 'imageRemove', 'imageLink', 'linkOpen', 'linkEdit', 'linkRemove', '-', 'imageDisplay', 'imageStyle', 'imageAlt', 'imageSize', 'filestackIcon']` | Buttons in the popup shown when an image is clicked |
| `imageInsertButtons` | `['imageBack', '|', 'imageUpload', 'imageByURL', 'imageManager', 'openFilePickerImage']` | Tabs of the Insert Image popup |
| `imageStyles` | `{ 'fr-rounded': 'Rounded', 'fr-bordered': 'Bordered', 'fr-shadow': 'Shadow' }` | Class → label for the `imageStyle` button |
| `imageMove` | `true` | Drag images to move them |
| `imagePaste` | `true` | Allow pasting images |
| `imageResize` | `true` | Resize handles |
| `imageAllowedTypes` | `['jpeg', 'jpg', 'png', 'gif', 'webp']` | |
| `imageMaxSize` | `10485760` (10 MB) | |
| `useClasses` | `true` | Alignment and display as classes (needs `froala_style.min.css` where content is shown) |

**Classes written with `useClasses: true`** (observed): the default image is saved as `<img src="…" style="width: 300px;" class="fr-fic fr-dib">`. With `imageDefaultAlign: 'left', imageDefaultDisplay: 'inline', imageDefaultWidth: 0` it was `class="fr-fil fr-dii"` with no width.

| Class | Meaning |
|---|---|
| `fr-dib` / `fr-dii` | display block / inline |
| `fr-fil` / `fr-fic` / `fr-fir` | aligned left / center / right |
| `fr-rounded`, `fr-bordered`, `fr-shadow` | the default `imageStyles` |

These classes only look right on a display page that loads `froala_style.min.css` and wraps the content in `class="fr-view"` (see froala-initialization-and-sdks).

**Avoid `useClasses: false` in 5.6.0.** Observed: `html.get()` then returned the editor's working styles inline (`cursor: pointer; padding: 0px 1px; position: relative; max-width: 100%`) plus `fr-original-style` / `fr-original-class` attributes, both after `image.insert()` and after `html.set()`. Keep the default and load `froala_style.min.css` instead (for email HTML, inline the styles on the server).

## Tables

| Option | Default |
|---|---|
| `tableStyles` | `{ 'fr-dashed-borders': 'Dashed Borders', 'fr-alternate-rows': 'Alternate Rows' }` |
| `tableCellStyles` | `{ 'fr-highlighted': 'Highlighted', 'fr-thick': 'Thick' }` |
| `tableMultipleStyles` / `tableCellMultipleStyles` | `true` (several styles can be combined) |
| `tableResizer` | `true` (drag column borders) |
| `tableResizerOffset` | `5` (px from the border where dragging starts) |
| `tableResizingLimit` | `30` (minimum column width in px) |
| `tableDefaultWidth` | `'50%'` |
| `tableInsertMaxSize` | `10` (largest grid in the insert popup) |
| `tableInsertHelper` | `true` |
| `tableColors` | the 27-colour palette plus `'REMOVE'` (same as `colorsText`) |
| `tableEditButtons` | `['tableHeader', 'tableFooter', 'tableRemove', 'tableRows', 'tableColumns', 'tableProperties', '-', 'tableCells', 'tableCellProperties', 'tableCellVerticalAlign', 'tableCellHorizontalAlign', 'tableCellStyle']` |

Custom styles are your own classes, styled in your CSS under `.fr-view`:

```js
new FroalaEditor('#editor', {
  tableStyles: { 'my-striped': 'Striped', 'my-compact': 'Compact' },
  tableCellStyles: { 'my-cell-warning': 'Warning' },
});
```

Setting `tableStyles` replaces the defaults; add `'fr-dashed-borders'` / `'fr-alternate-rows'` back if you want to keep them.

## Links

| Option | Default | Notes |
|---|---|---|
| `linkAlwaysBlank` | `false` | `true` adds `target="_blank"` to every link |
| `linkNoOpener` / `linkNoReferrer` | `true` / `true` | add `rel="noopener"` / `rel="noreferrer"` to `target="_blank"` links (observed; a link without `_blank` got no `rel`) |
| `linkAlwaysNoFollow` | `false` | add `rel="nofollow"` |
| `linkAutoPrefix` | `'http://'` | Prefix for links entered without a scheme. Observed with `'https://'`: `link.insert('example.com', …)` saved `href="https://example.com"` |
| `linkAttributes` | `{}` | Extra attributes to edit in the link popup: `{ attribute: 'Placeholder' }` |
| `linkList` | Froala, Google and Facebook sample links | Predefined links for the `linkList` button; set your own or `[]` |
| `linkInsertButtons` | `['linkBack', '|', 'linkList']` | |
| `linkEditButtons` | `['linkOpen', 'linkStyle', 'linkEdit', 'linkRemove']` | |
| `linkStyles` | `{ 'fr-green': 'Green', 'fr-strong': 'Thick' }` | |
| `linkConvertEmailAddress` | `true` | |

```js
new FroalaEditor('#editor', {
  linkAlwaysBlank: true,
  linkAutoPrefix: 'https://',
  linkList: [{ text: 'Help centre', href: 'https://example.com/help', target: '_blank' }],
  linkAttributes: { title: 'Tooltip text' },
});
// From code: editor.link.insert(href, text, attrs)
```

Observed with `linkAlwaysBlank: true`: `editor.link.insert('https://example.com', 'Example', { rel: 'nofollow' })` produced `<a href="https://example.com" rel="nofollow noopener noreferrer" target="_blank">Example</a>`.

## Enter key: paragraphs, divs or line breaks

| Option | Default |
|---|---|
| `enter` | `FroalaEditor.ENTER_P` (`0`); also `FroalaEditor.ENTER_DIV` (`1`) and `FroalaEditor.ENTER_BR` (`2`) |

Observed after typing `one`, Enter, `two`, Shift+Enter, `three`:

| `enter` | `html.get()` |
|---|---|
| `FroalaEditor.ENTER_P` | `<p>one</p><p>two<br>three</p>` |
| `FroalaEditor.ENTER_DIV` | `<div>one</div><div>two<br>three</div>` |
| `FroalaEditor.ENTER_BR` | `one<br>two<br>three` (no wrapping element) |

```js
new FroalaEditor('#editor', { enter: FroalaEditor.ENTER_BR });
```

- Use the constants, not strings. Observed: `enter: 'br'` produced `<undefined>one</undefined><br><undefined>two</undefined><br><undefined>three</undefined>`.
- Shift+Enter inserted a `<br>` in every mode.
- `enter` only affects typing. `html.set('<p>a</p><p>b</p>')` kept the `<p>` elements in all three modes (observed); convert existing content yourself if needed.
- In `ENTER_BR` mode typed text is not wrapped in block elements. Block commands still create their own: `formatUL` on two lines gave `<ul><li>one</li><li>two</li></ul>` (observed).

## Non-editable content and HTML handling

**Locked blocks.** Elements with `contenteditable="false"` stay in the content and can't be edited. Observed: Backspace next to a plain `<span contenteditable="false">` did **not** delete it. Add the class `fr-deletable` to let Backspace/Delete remove the whole element in one step (observed: the span was removed as a unit). This is how mention chips and placeholders are built.

```html
<p>Dear <span class="fr-deletable" contenteditable="false">{{first_name}}</span>,</p>
```

| Option | Default | Observed effect |
|---|---|---|
| `htmlAllowComments` | `true` | `false` removed `<!-- … -->` comments |
| `htmlUntouched` | `false` | `true` stopped Froala from wrapping loose text in `<p>` and kept an empty `<p></p>`; a tag not in `htmlAllowedTags` (a custom element) was still removed |
| `htmlDoNotWrapTags` | `['script', 'style']` | Tags left outside paragraphs. With `'span'` added, `<span>s</span>text` became `<span>s</span><p>text</p>` instead of `<p><span>s</span>text</p>` |
| `htmlExecuteScripts` | `true` | |
| `htmlSimpleAmpersand` | `false` | |
| `htmlIgnoreCSSProperties` | `[]` | |

To keep custom elements or attributes, add them to `htmlAllowedTags` / `htmlAllowedAttrs` (global rules; keep every tag your toolbar produces). These rules run in the browser only: sanitise on the server too.

## Fonts, sizes, colours and styles

| Option | Default |
|---|---|
| `fontFamily` | `{ 'Arial,Helvetica,sans-serif': 'Arial', 'Georgia,serif': 'Georgia', 'Impact,Charcoal,sans-serif': 'Impact', 'Tahoma,Geneva,sans-serif': 'Tahoma', 'Times New Roman,Times,serif,-webkit-standard': 'Times New Roman', 'Verdana,Geneva,sans-serif': 'Verdana' }` |
| `fontFamilySelection` | `false` (`true` shows the current font name on the button) |
| `fontFamilyDefaultSelection` | `'Font Family'` |
| `fontSize` | `['8', '9', '10', '11', '12', '14', '18', '24', '30', '36', '48', '60', '72', '96', 'custom']` |
| `fontSizeUnit` | `'px'` |
| `fontSizeSelection` | `false` |
| `fontSizeDefaultSelection` | `'Font Size'` |
| `colorsText` / `colorsBackground` | a 27-colour palette plus `'REMOVE'` |
| `colorsStep` | `7` (colours per row) |
| `colorsHEXInput` | `true` |
| `paragraphStyles` | `{ 'fr-text-gray': 'Gray', 'fr-text-bordered': 'Bordered', 'fr-text-spaced': 'Spaced', 'fr-text-uppercase': 'Uppercase' }` |
| `inlineClasses` | `{ 'fr-class-code': 'Code', 'fr-class-highlighted': 'Highlighted', 'fr-class-transparency': 'Transparent' }` |
| `inlineStyles` | `{ 'Big Red': 'font-size: 20px; color: red;', 'Small Blue': 'font-size: 14px; color: blue;' }` |

**`fontFamilyDefaultSelection` and `fontSizeDefaultSelection` are only button labels.** Observed: with `fontFamilyDefaultSelection: 'Roboto'` and `fontSizeDefaultSelection: '14'`, the buttons read "Roboto" and "14", but the editing area still used the editor's own font (`sans-serif`, `14px`) and no font markup was added to the HTML. To change the default font, style the content with CSS, and use the same CSS where content is displayed:

```css
.fr-view { font-family: Roboto, sans-serif; font-size: 16px; }
```

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['fontFamily', 'fontSize', 'textColor', 'paragraphStyle', 'inlineClass'],
  fontFamily: { 'Roboto,sans-serif': 'Roboto', 'Georgia,serif': 'Georgia' },
  fontFamilySelection: true,
  fontFamilyDefaultSelection: 'Roboto', // label only
  fontSize: ['12', '14', '18', '24'],
  fontSizeSelection: true,
  colorsText: ['#000000', '#C00000', '#1F4E79', 'REMOVE'],
  paragraphStyles: { lead: 'Lead paragraph' }, // class → label; style .fr-view .lead in your CSS
  inlineClasses: { kbd: 'Keyboard key' },
});
```

Observed: `fontSize.apply('18px')` wrapped the selection in `<span style="font-size: 18px;">`; `paragraphStyle.apply('lead')` added `class="lead"` to the `<p>`. Setting `fontFamily`, `paragraphStyles` or `inlineClasses` replaces the default list.

## Code view (HTML source)

Button `html` (plugin `codeView`). Methods: `editor.codeView.toggle()`, `editor.codeView.isActive()`, `editor.codeView.get()`; event `codeView.update`.

| Option | Default |
|---|---|
| `codeMirror` | `window.CodeMirror` as it was when the plugin loaded: CodeMirror is used only if its script was loaded before Froala. `false` forces a plain textarea |
| `codeMirrorOptions` | `{ lineNumbers: true, tabMode: 'indent', indentWithTabs: true, lineWrapping: true, mode: 'text/html', tabSize: 2 }` |
| `codeBeautifierOptions` | `{ end_with_newline: true, indent_inner_html: true, extra_liners: [...], brace_style: 'expand', indent_char: '\t', indent_size: 1, wrap_line_length: 0 }` (needs the `codeBeautifier` plugin) |
| `codeViewKeepActiveButtons` | `['fullscreen']` (toolbar buttons that stay enabled in code view) |

Observed with `codeBeautifierOptions: { indent_size: 2, indent_char: ' ' }`: the source showed `<ul>\n  <li>a</li>\n</ul>`.

**Edits made in code view are not in the editor until code view is closed.** Observed in 5.6.0, while code view was active and its source had been changed:

- `html.get()` still returned the content from before code view opened;
- `contentChanged` did not fire, so framework models (`onModelChange`, `v-model`, `[(froalaModel)]`) did not update;
- `codeView.get()` returned the edited source;
- closing code view (`codeView.toggle()`) applied the source and fired `contentChanged` once;
- a plain form with the editor on a `<textarea>` did submit the edited source.

So close code view before reading content from code:

```js
function getContent(editor) {
  if (editor.codeView && editor.codeView.isActive()) {
    editor.codeView.toggle(); // applies the source and fires contentChanged
  }
  return editor.html.get();
}
```

## Clearing the undo history: `undo.reset()`

After loading a document from code, clear the history so Ctrl+Z can't undo the load:

```js
editor.html.set(savedHtml);
editor.undo.saveStep(); // fires contentChanged, so wrapper models update
editor.undo.reset();    // Ctrl+Z can no longer go back past this point
```

Observed: after typing and then loading a draft with `html.set()` + `undo.saveStep()`, `editor.undo.run()` brought back the typed text; with `undo.reset()` after the load, `undo.run()` left the draft in place. `undo.reset()` itself did not fire `contentChanged`. (In React, changing `model` already resets the history unless the wrapper's `skipReset` prop is set.)
