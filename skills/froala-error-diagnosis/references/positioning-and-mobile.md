# Popup and toolbar positioning, modals, and mobile

Part of the froala-error-diagnosis skill (verified against froala-editor 5.6.0). Start from the symptom index in that skill's SKILL.md.

Every fix in this file was reproduced in headless Chromium with froala-editor 5.6.0 and Bootstrap 5.3.9, on 2026-11-25. Option defaults are quoted from the package's `DEFAULTS`.

## Contents

- How Froala places popups
- Popup Detached From the Text in a Scrolling Container
- Editor in a Modal or Dialog: Popup Hidden, or Typing Goes Into the Editor
- Sticky Toolbar Hidden Under a Fixed Header, or Not Sticking in a Scrolling Container
- Toolbar Dropdown Clipped by `overflow: hidden`
- Mobile and iOS Safari

## How Froala places popups

| Option | Default (5.6.0) | What it does |
|---|---|---|
| `scrollableContainer` | `'body'` | The element popups are appended to (docs: "Sets the container in which the editor popups are added") |
| `zIndex` | `1` | Base z-index of toolbars and popups. Popups get `zIndex + 3`, so the default is `4` |
| `toolbarContainer` | `null` | A selector; the toolbar is rendered inside that element instead of above the editor |
| `toolbarSticky` | `true` | Keeps the toolbar visible while the editor scrolls |
| `toolbarStickyOffset` | `0` | Distance of the sticky toolbar from the top (from the bottom with `toolbarBottom`) |
| `toolbarBottom` | `false` | Toolbar below the content. The docs say it is not available on mobile devices |

Popups opened from a toolbar button (for example Insert Link) are placed inside `.fr-toolbar`. Popups opened by clicking content (the edit popup of a link, image, video or table) are appended to `scrollableContainer`, which is `<body>` by default. Most positioning bugs are about that second kind.

---

## Popup Detached From the Text in a Scrolling Container

**Symptom:** the editor sits inside an element with `overflow: auto` (a panel, a card, a split view). The link or image edit popup opens in the right place, but when the panel scrolls the popup stays where it was, or ends up off-screen.

**Cause:** the popup is appended to `<body>`, so it does not move when the inner element scrolls. Observed: after a 120 px scroll of the panel, the popup was 130 px below the link instead of 10 px.

**Fix:** set `scrollableContainer` to the element that scrolls, and make sure that element is positioned (`position: relative`). Both are needed. Without `position: relative` the popup is placed inside the panel but still does not follow the scroll.

```css
#editor-panel { overflow-y: auto; position: relative; }
```

```js
new FroalaEditor('#editor', {
  scrollableContainer: '#editor-panel', // a unique selector for the scrolling element
});
```

If popups are still offset after this change, compare the layout with the open issues in `known-issues.md` (fixed side panels, flex layouts with `toolbarSticky`, `toolbarInline` on a long page).

---

## Editor in a Modal or Dialog: Popup Hidden, or Typing Goes Into the Editor

**Symptom (Bootstrap 5 modal):** clicking a link or image inside the editor shows no popup, or the popup is visible but clicking into its URL field closes it and the typed text lands in the editor.

**Causes, as observed:**

1. The edit popup is appended to `<body>` with z-index `4`, behind the modal (Bootstrap's modal uses `1055`). It is there but cannot be seen or clicked.
2. With a higher `zIndex` alone, the popup shows, but it is still outside the modal. Bootstrap's focus trap moves focus back into the modal as soon as the popup's input gets focus. The popup closes and the keystrokes go to the editor. In the test, select-all plus typing replaced the whole document. (With the AI Assist plugin loaded, as in both `pkgd` bundles, the trap first tries a non-focusable `<a class="fr-message">` in the AI menu, so focus happens to stay in the popup and typing works. Don't rely on that.)

**Fix:** put the popups inside the modal with `scrollableContainer`. Use the element that scrolls: `.modal-body` for `modal-dialog-scrollable` dialogs (Bootstrap already gives `.modal-body` `position: relative`).

```js
new FroalaEditor('#editor', {
  scrollableContainer: '#editModal .modal-body',
});
```

Observed with this setting: the popup appears next to the link, typing a new URL works, and the popup follows the text when the modal body scrolls. (When the sticky toolbar engages on the first scroll, the popup moves once by about the toolbar's height, from below the link to just above it, then stays with the link.) Setting it to the modal element itself (`'#editModal'`) also showed the popup, but in a `modal-dialog-scrollable` dialog the popup stayed behind when the body scrolled (160 px off after a 150 px scroll).

**Alternative:** set `zIndex` above the modal (for example `2000`) **and** turn off Bootstrap's focus trap with `data-bs-focus="false"` on the modal. This worked in the test, but it removes the modal's keyboard focus handling, so prefer `scrollableContainer`.

In the test the editor was created in the `shown.bs.modal` handler.

**Other dialog libraries:** only Bootstrap 5.3 was tested here. A dialog that traps focus (MUI, Angular CDK, Headless UI…) has the same two failure modes, so try the same fix: point `scrollableContainer` at a positioned element inside the dialog, then check that you can type into the link popup. For Angular Material, popups that opened behind v21 dialogs were also fixed in 5.6.0 (see `fixed-in-5.6.0.md`).

---

## Sticky Toolbar Hidden Under a Fixed Header, or Not Sticking in a Scrolling Container

**Symptom 1:** the page has a fixed header. When the page scrolls, the editor's toolbar sticks at the top of the window, under the header, and can't be seen.

**Fix:** set `toolbarStickyOffset` to the header height. Observed with a 60 px header: the toolbar stuck at `top: 0` (hidden) by default, and at 60 px, visible, with `toolbarStickyOffset: 60`.

```js
new FroalaEditor('#editor', { toolbarStickyOffset: 60 });
```

`toolbarSticky: false` turns the sticky toolbar off; the toolbar then scrolls out of view with the content.

**Symptom 2:** the page itself does not scroll (for example `overflow: hidden` on `<body>`); an inner element does. The toolbar scrolls away with the content instead of sticking.

**Fix:** set `scrollableContainer` to the scrolling element. Observed: by default the toolbar ended 620 px above the visible area; with `scrollableContainer: '#scroller'` it stuck at the top of the scrolling element.

---

## Toolbar Dropdown Clipped by `overflow: hidden`

**Symptom:** the editor is inside a box with `overflow: hidden` (or a short fixed height). Toolbar dropdowns such as Paragraph Format are cut off.

**Fix:** render the toolbar outside the clipping box with `toolbarContainer`. Observed: with the default, the last item of the Paragraph Format dropdown could not be clicked; with `toolbarContainer: '#toolbar'` (an element outside the box) it could.

```html
<div id="toolbar"></div>
<div class="card" style="overflow: hidden"><div id="editor"></div></div>
```

```js
new FroalaEditor('#editor', { toolbarContainer: '#toolbar' });
```

If toolbars or popups appear behind other positioned elements on the page (a sticky app header, a side drawer), raise `zIndex` above them. With `zIndex: 2000`, popups got `z-index: 2003`.

---

## Mobile and iOS Safari

**What the package provides (5.6.0):**

- **Responsive toolbar.** `toolbarButtonsXS` (window narrower than 768 px), `toolbarButtonsSM` (768–991 px), `toolbarButtonsMD` (992–1199 px), and `toolbarButtons` for 1200 px and wider. All three default to `null` in the package. Observed: when only `toolbarButtons` is set, phones show that same full list, so set `toolbarButtonsXS` to give phones a shorter toolbar. The set switches when the window is resized. With `toolbarResponsiveToEditor: true`, the editor's width is used instead of the window's (a 400 px editor in a wide window showed the XS set).
- **Device helpers.** `editor.helpers.isMobile()`, `isIOS()`, `isAndroid()` and `isTouch()` are in `index.d.ts`. Under Playwright device emulation, iPhone 13 and iPad Mini returned `isIOS() === true` and Pixel 5 `isAndroid() === true`; all three returned `isMobile() === true`. The toolbar gets the class `fr-mobile` (and `fr-sticky-ios` on iOS) instead of `fr-desktop`, which is useful for CSS overrides.

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', 'underline', 'formatOL', 'formatUL', 'insertLink', 'insertImage', 'undo', 'redo'],
  toolbarButtonsXS: ['bold', 'italic', 'insertLink', 'undo'],
});
```

**What emulation does not show:** device emulation changes the user agent and viewport, but it is still Chromium. Selection, focus and keyboard bugs in iOS Safari only reproduce on a real device or the iOS Simulator. Several are open in 5.6.0 (popups closing at once on iPad, `blur` not firing with `toolbarInline`, background colour not applied, special characters inserted at the start); see `known-issues.md`. None has a confirmed workaround, so tell the user which issue matches and test on the device.
