# Froala 3.x → 4.x

Sources: [Migrate from Version 2 to Version 4](https://froala.com/wysiwyg-editor/docs/migrate-from-version-2-to-version-4/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-upgrade) (its v4 sections), [Migrating from Froala V3 to V5](https://froala.com/wysiwyg-editor/docs/migrating-from-froala-3-to-froala-5/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-upgrade) (lists what each 4.x release added), the [changelog](https://froala.com/wysiwyg-editor/changelog/), and diffs of the npm packages `froala-editor` 3.2.7, 4.0.0, 4.5.2, 4.6.0, 4.7.0 and 4.7.1. The old `/docs/migrate-from-version-3-to-version-4/` URL now redirects to the v3 → v5 guide.

Going from 3.x straight to 5.x? Read this file, then `v4-to-v5.md`.

## API compatibility

- Initialization is the same as in v3 (`new FroalaEditor(selector, options, callback)`).
- No option was removed between 3.2.7 and 4.7.1, and no toolbar command except the table cell background commands below (package diff).
- `html.wrap` was updated in 4.1.0 (v3→v5 guide; no detail given). If the project calls `html.wrap()` directly, re-test it.

## New plugins (load the file, or add the name to `pluginsEnabled`)

| Version | Plugin | File | `pluginsEnabled` name |
|---|---|---|---|
| 4.0.0 | Markdown Support | `js/plugins/markdown.min.js` | `markdown` |
| 4.0.0 | Track Changes | `js/plugins/track_changes.min.js` | `track_changes` |
| 4.2.0 | Word Counter | `js/plugins/word_counter.min.js` | `wordCounter` |
| 4.3.0 | Filestack | `js/plugins/filestack.min.js` | `filestack` |
| 4.5.2 | Find and Replace | `js/plugins/find_and_replace.min.js` | `findReplace` |
| 4.7.0 | Anchor | `js/plugins/link_to_anchor.min.js` | `linkToAnchor` |
| 4.7.0 | Page Break | `js/plugins/page_break.min.js` | `pageBreak` |
| 4.7.0 | Export to Word | `js/plugins/export_to_word.min.js` | `exportToWord` |

New toolbar buttons: `markdown`, `trackChanges` (with `showChanges`, `applyAll`, `removeAll`, `applyLast`, `removeLast`), `findReplaceButton`, `insertAnchor`, `pageBreak`, `export_to_word`, `openFilePicker`. The guides' example: `pluginsEnabled: ['image', 'link', 'track_changes', 'markdown']`.

Per the v3 → v5 guide, all of these except Track Changes are in `froala_editor.pkgd.js`. Load `track_changes.min.js` yourself.

## New options (v3 → v5 guide)

`trackChangesEnabled`, `showChangesEnabled` (4.0), `toolbarResponsiveToEditor` (4.1.0), `tableResizer`, `tableResizerOffset`, `tableResizingLimit` (4.1.3), `fontFamilyDefaultSelection`, `fontSizeDefaultSelection`, `preserveTabSpaces`, `tabSpaces` (4.2.1), `pluginsDisabled` (4.5.0), `allowStylingOnNonEditable` (4.5.1), `tableDefaultAlign`, `tableDefaultHeight`, `tableDefaultBGColor`, `tableDefaultBorderColor`, `tableDefaultBorderWidth`, `tableDefaultBorderStyle` (4.6.0), `proportionalTableResize`, `enableTableSelection` (4.6.2), `clearFormatOnEnterNewLine`, `cleanReduntantStyleOnGet` (4.7.2 in the guide; present in the 4.7.1 package). `lineHeights` also accepts an array of objects from 4.5.0.

`pluginsDisabled` (4.5.0+) is the simplest way to switch off one plugin from a `pkgd` bundle without listing all the others in `pluginsEnabled`.

## Default changes that alter new content (package diff)

| Setting | 3.2.7 – 4.5.2 | 4.6.0 + |
|---|---|---|
| `tableDefaultWidth` | `'100%'` | `'50%'` — new tables are half as wide |
| `tableEditButtons` | `…'tableStyle', '-', 'tableCells', 'tableCellBackground', …` | `…'tableProperties', '-', 'tableCells', 'tableCellProperties', …` plus `tableFooter` |
| `tableCellBackground` button | exists | removed in 4.6.0–4.7.1, back in 5.0.0 |

If a project lists `tableCellBackground` in `tableEditButtons` and stops at 4.6.x or 4.7.x, the button is missing; use `tableCellProperties` or go to 5.x. Set `tableDefaultWidth: '100%'` to keep the old table width. 4.6.0 also added default border width/style (`'1px'`, `'solid'`), which 5.0.0 changed again (see `v4-to-v5.md`).

## Default toolbar

When `toolbarButtons` isn't set, 4.7.1's default toolbar adds an `exportImport` group (`export_to_word`), a hidden `trackChanges` group, and `trackChanges`, `markdown`, `insertAnchor`, `pageBreak`, `openFilePicker` (Rich) and `findReplaceButton` (Misc). Buttons only show when their plugin is loaded, so with a `pkgd` bundle they appear. Set `toolbarButtons` explicitly to keep the v3 toolbar.

## Licence

4.7.0 introduced Froala's public trial key (changelog: "Trial license Key implementation"): `TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE`. It never licenses a production site. Ask Froala whether an existing v3 key covers 4.x: the v3 → v4 guide that answered this is no longer online. A v5 key is always needed for 5.x.

## Packaging and wrappers

- TypeScript declarations (`index.d.ts`, `"types"` in `package.json`) ship with `froala-editor` from 4.1.0. Remove a hand-written `declare module 'froala-editor'` shim if it conflicts.
- `vue-froala-wysiwyg` moved from Vue 2 to Vue 3 at 4.1.0 (see `wrappers.md`).
- React 19 support arrived in 4.6 (changelog).
