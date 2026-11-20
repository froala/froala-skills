# Froala 4.x → 5.x (and 3.x → 5.x)

Sources: [Migrating from Froala V4 to Froala V5](https://froala.com/wysiwyg-editor/docs/migrating-from-froala-4-to-froala-5/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-upgrade), [Migrating from Froala V3 to Froala V5](https://froala.com/wysiwyg-editor/docs/migrating-from-froala-3-to-froala-5/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-upgrade), the [changelog](https://froala.com/wysiwyg-editor/changelog/), and diffs of the npm packages `froala-editor` 4.7.1, 5.0.0 and 5.6.0.

Coming from 3.x: also read `v3-to-v4.md`; everything 4.x added applies to you.

## What Froala's guides say

- "Migrating from Froala V4 to V5 is a straightforward process with no breaking changes." The v3 → v5 guide says the same for v3.
- **"To use Froala V5 you need a new API key."** Contact support@froala.com. Put it in the `key` option.
- Initialization is unchanged: "just add your new API key, and the editor will continue to function as it did before".
- New plugins must be loaded (or are in `froala_editor.pkgd.js`), and added to `pluginsEnabled` if the project sets it.

The package diff agrees: no option was removed between 4.7.1 and 5.6.0, and no toolbar command was removed (5.0.0 brought `tableCellBackground` back).

## New plugins in 5.x

| Version | Plugin | File | `pluginsEnabled` name | Toolbar button |
|---|---|---|---|---|
| 5.0.0 | Code Snippet | `js/plugins/code_snippet.min.js` | `codeSnippet` | `codeSnippet` |
| 5.0.0 | Import from Word | `js/plugins/import_from_word.min.js` | `importFromWord` | `import_from_word` |
| 5.1.0 | AI Assist | `js/plugins/ai_assist.min.js` | `aiAssist` | `aiAssist`, `aiShortCuts` (5.4.0+: `aiChatAssistant`) |
| 5.2.0 | Image Filerobot | `js/third_party/imageFileRobot.min.js` (not in the `pkgd` bundles) | `imageFilerobot` | `imageFilerobot` |
| 5.3.0 | Collaborative | `js/plugins/collaborative.min.js` (needs a collaboration backend) | `collaborative` | `collabMode`, `collabPresence`, `collabAddComment`, `versionControl`, … |
| 5.6.0 | Accessibility Checker | `js/plugins/accessibility_checker.min.js` | `accessibilityChecker` | `accessibilityChecker` |
| 5.6.0 | Paint Format | `js/plugins/paint_format.min.js` | `paintFormat` | `paintFormat` |

Each plugin also has a CSS file under `css/plugins/` (Filerobot: `css/third_party/imageFileRobot.min.css`). The guides' example: `pluginsEnabled: ['image', 'link', 'exportToWord', 'codeSnippet']`.

## Default changes that alter new content (package diff)

| Setting | 4.6.0 – 4.7.1 | 5.0.0 + |
|---|---|---|
| `tableDefaultBorderWidth` | `'1px'` | `''` |
| `tableDefaultBorderStyle` | `'solid'` | `''` |
| `tableCellBackground` button | missing | back (not in the default `tableEditButtons`) |

To keep 4.x table borders on new tables, set `tableDefaultBorderWidth: '1px'` and `tableDefaultBorderStyle: 'solid'`. Existing content is not changed.

## Default toolbar

If the project doesn't set `toolbarButtons`, the default toolbar grows with each 5.x release (`import_from_word`, `codeSnippet` in 5.0.0; AI Assist, collaboration and version-control buttons from 5.3.0; `aiChatAssistant`, `collabPanel`, `paintFormat`, `accessibilityChecker` by 5.6.0). With a `pkgd` bundle their plugins are loaded, so the buttons appear. Set `toolbarButtons` (and `pluginsEnabled`) to what the app actually uses.

## New options, methods and events

The guides list every option, method and event added in 5.0.0 – 5.5.0 (for example `retainLineBreaksInCellsOnWrap` 5.0.0, `toolbarButtonsEnabledOnEditorOff`, `tableHorizontalResizer`, `tableVerticalResizer` 5.0.1, `drop.beforeCleanup` / `drop.afterCleanup` 5.1.0, `preserveListLineOnBackspace` 5.2.0, `fontSizeCustomMin` / `fontSizeCustomMax` / `importFromWordMammoth` 5.3.0, the `aiChat*` options and `markdown.getMarkdown()` / `markdown.setMarkdown()` 5.4.0, `headless` and `preserveListMarkerStyle` 5.5.0). None is required for an upgrade. Version gates and behaviour changes per minor release: `5x-minor-releases.md`.

## Wrappers

React, Vue and Angular wrappers have the same version numbers as `froala-editor` and depend on one exact core version. Upgrade them in the same install. Svelte has a wrapper from 5.3.0. See `wrappers.md`.

## Checklist

1. Get the v5 key; set it in `key` (from an environment variable) **before** any content is saved with the new editor.
2. Upgrade `froala-editor` and the wrapper together.
3. Load new plugin files / add plugin names if the project uses `pluginsEnabled` or a non-`pkgd` build.
4. Decide on table border defaults and the default toolbar.
5. Read `5x-minor-releases.md` for the target version, especially 5.6.0's licence behaviour.
6. Run the round-trip diff (SKILL.md step 6).
