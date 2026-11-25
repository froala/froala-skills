# Known open issues in froala-editor 5.6.0

Part of the froala-error-diagnosis skill (verified against froala-editor 5.6.0). Start from the symptom index in that skill's SKILL.md.

Checked on **2026-11-25**: each issue below was open on [froala/wysiwyg-editor](https://github.com/froala/wysiwyg-editor/issues) that day. The descriptions summarise the reporters' words. Before quoting an issue to the user, check that it is still open (`gh issue view -R froala/wysiwyg-editor <number>`) and look at the changelog for the installed version: a later release may have fixed it.

Use this list to tell a user "this is a known bug" when their setup matches. Don't present a workaround that isn't listed here as confirmed.

## Popup and toolbar positioning

| Issue | Reported symptom | Workaround |
|---|---|---|
| [#5048](https://github.com/froala/wysiwyg-editor/issues/5048) | Link/image edit popups far to the right, often off-screen, when `scrollableContainer` is a `position: relative` wrapper inside a `position: fixed` panel pinned to the right | None confirmed |
| [#5049](https://github.com/froala/wysiwyg-editor/issues/5049) | With `toolbarSticky: true` and `scrollableContainer` in a flex layout, popups are offset by the width of the left sidebar and by the container's `scrollTop` | None confirmed |
| [#5052](https://github.com/froala/wysiwyg-editor/issues/5052) | Popups get a negative `top` with a `position: relative` `scrollableContainer`; reported as introduced in 5.2.0 | None confirmed |
| [#5059](https://github.com/froala/wysiwyg-editor/issues/5059) | With `toolbarInline: true`, the inline toolbar and popups appear about one page-scroll below the selection when `<body>` has `position: relative` (reported on 5.3.0) | None confirmed |
| [#5072](https://github.com/froala/wysiwyg-editor/issues/5072) | Pressing Enter near the bottom of a custom `scrollableContainer` (with `toolbarSticky: true`) scrolls it nearly to the top | None confirmed |
| [#4936](https://github.com/froala/wysiwyg-editor/issues/4936) | The table popup is misplaced when the editor container has a scrollbar (reported on 4.3.1 and 4.5.2) | None confirmed |
| [#4962](https://github.com/froala/wysiwyg-editor/issues/4962) | Sticky toolbar does not stick when `<body>` has `overflow: hidden` and a child element scrolls (Bootstrap layout) | Set `scrollableContainer` to the scrolling element; reproduced in `positioning-and-mobile.md` |

The basic `scrollableContainer` fix in `positioning-and-mobile.md` worked in a test layout with a 250 px sidebar, a flex row and a scrolled page. The issues above describe layouts where it is reported not to be enough.

## Mobile and iOS

| Issue | Reported symptom | Workaround |
|---|---|---|
| [#4918](https://github.com/froala/wysiwyg-editor/issues/4918) | Link, image and video popups open and close at once in a mobile browser in "Desktop site" mode; also reported on iPad Safari (5.0.0) | None confirmed |
| [#5039](https://github.com/froala/wysiwyg-editor/issues/5039) | On iPad with `toolbarInline: true`, the editor's `blur` event does not fire | None confirmed |
| [#5025](https://github.com/froala/wysiwyg-editor/issues/5025) | Background colour is not applied to selected text on iPad Safari | None confirmed |
| [#4732](https://github.com/froala/wysiwyg-editor/issues/4732) | On iOS, special characters are inserted at the start of the document instead of at the caret | None confirmed |

## TypeScript

| Issue | Reported symptom | Status in the package |
|---|---|---|
| [#4879](https://github.com/froala/wysiwyg-editor/issues/4879) | `TS2300: Duplicate identifier 'LineHeight'` in `index.d.ts` | Still open on GitHub, but the duplicate is only in froala-editor **4.5.0**: from 4.5.1 the type is renamed `LineHeightObj`. Checked with `tsc` against 4.5.0, 4.5.1, 4.5.2 and 5.6.0. See `frameworks.md` |
| [#5010](https://github.com/froala/wysiwyg-editor/issues/5010) | No type declarations for `froala-editor/js/plugins.pkgd.min.js` | Still true in 5.6.0 (`TS7016` on a dynamic import). Add a `declare module` line; see `frameworks.md` |
