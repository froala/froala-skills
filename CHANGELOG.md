# Changelog

## 1.1.0 — 2026-11-18

Every skill re-checked against the published `froala-editor` 5.6.0 package (and 5.5.0, which the review started from) and its React, Vue, Angular and Svelte wrappers. Reviewed by an independent reviewer; all review findings below were reproduced before being applied.

### Fixed

- **custom-plugins:** custom SVG icons used an `SVG` key that Froala's icon template ignores, so icons rendered empty. Now `PATH` / `VIEWBOX`. Popup example no longer uses an inline `onclick` and escapes user input.
- **error-diagnosis:** without an upload target Froala inserts temporary `blob:` URLs, so images disappear after reload (documented). New sections: Angular NG2012, SSR (`Element is not defined`), TypeScript TS7016, Word import/export, PDF button doing nothing (html2pdf.js missing). Registration-order causes corrected.
- **document-features:** version gates corrected (Export to Word 4.7.0+, Import from Word 5.0.0+, collaboration 5.3.0+, Markdown API 5.4.0+). Markdown: `setMarkdown()` only changes the editor when Markdown mode is on; verification now checks the visible editor and the saved document. Collaboration roles corrected (editors can suggest). mammoth raised to 1.11.0+ (advisory GHSA-rmjr-87wv-gf87); `importFromWordMammoth` documented for bundlers.
- **ai-assist:** `inlineSuggestions` is on by default (documented). Backend example forwards the whole request and, when streaming, returns `{ answer, session_id, webSearchUsed }` so AI Chat keeps the conversation. AI image generation is no longer advertised until its contract is documented.
- **filestack-integration:** manual examples upload every dropped file in order instead of only the first.
- **methods-and-events:** React examples guard both the editor and its `html` module (`getEditor()?.html?.…`); handler `this` binding explained from the source.
- **initialization-and-sdks:** Angular standalone setup, `src/styles.css`, SSR and bundle-budget facts; Svelte/SvelteKit, Nuxt and TypeScript notes; React wrapper behaviour (`getEditor()`, `skipReset`, config read once, StrictMode); `pluginsDisabled`; `toolbarButtonsXS`; licensing limited to sourced facts.
- **bundle table:** `edit_in_popup` is a module included in both bundles; it was wrongly listed as "load separately".
- README and PLUGIN_DESCRIPTION no longer recommend `pluginsEnabled: ['filestack']`; descriptions list all skills.
- **methods-and-events / initialization-and-sdks:** content changed from code through `getEditor()` (`html.insert()`, `html.set()`) never reached `onModelChange`, because those methods do not fire `contentChanged`. Examples now call `editor.undo.saveStep()`; error-diagnosis has a matching section.
- **initialization-and-sdks / error-diagnosis:** Vite 8 with `react-froala-wysiwyg` 5.5.0 or older resolves the default import to `{ default: … }` and React throws "Element type is invalid"; workaround documented (fixed in 5.6.0). React display of saved content with `FroalaEditorView`.
- **licensing:** behaviour without a key is documented per version: on `localhost`, 5.5.0 shows only a badge; 5.6.0 also shows a notice and appends a "Powered by Froala Editor" paragraph to `html.get()`, which ends up in saved content.
- README: AI image generation no longer advertised; framework list complete.

### Changed

- Every skill opens with the same short description of Froala: a modern, framework-agnostic rich text editor that has not used jQuery since version 3, and what that means for old jQuery examples and the `$`-prefixed helpers of the current API.
- Frontmatter follows the Agent Skills spec: `version` moved under `metadata`, with `verified_against` and `last_validated`.
- CDN examples use `@VERSION` and tell the agent to use the installed version.

### Added

- Default setup in initialization-and-sdks: when the user has no preference and the project has no Froala config, use the latest version, Froala's public trial key (with an environment variable for the licence key) and a simple toolbar (undo/redo, text format, bold/italic/underline, link, image, lists). Every framework example uses it.
- Angular: check Node.js against the Angular CLI's range before `ng new`; show the editor inside `@defer`, which keeps Froala out of the initial bundle (new projects otherwise fail `ng build` on the 1 MB budget) and off the server in SSR builds (otherwise `ReferenceError: document is not defined`); `allowedCommonJsDependencies` in the standard setup. Error-diagnosis covers the budget error, the Node.js version error and the harmless build messages.
- Vue: import the plugin in the form the wrapper's README uses, so `app.use()` gets the plugin under Vite 8 (the `create-vue` default; a plain default import leaves a blank page); the TypeScript declaration file is a required step for TypeScript projects; editor API through a template ref and `getEditor()`, with `undo.saveStep()`; notes on the core-js 2 deprecation warning at install and an optional runtime-only Vue alias that removes about 93 kB of unused compiler code.
- Every framework wrapper: the `undo.saveStep()` rule for content changed from code (React, Vue and Angular reproduced). Angular: editor API through `(froalaInit)`, which needs a manual `initialize()` and an `any` parameter under strict templates. Markdown: `markdown.set` also fires when nothing was applied, so check the `setMarkdown()` return value.
- `froala-migrate` skill: detects existing editor integrations, compares in the conversation or writes a migration plan, builds Froala side by side, converts content on copies. Starts from Froala's official migration guides. Covers Rails Action Text attachments, PDF export dependencies and headless mode for projects with their own editor UI.
- `references/plugin-names.md` (generated): file → plugin or module → buttons → presence in each bundle.
- Froala 5.6.0 coverage: Accessibility Checker and Paint Format plugins, email and phone links, `popupDraggable`; per-version notes for the React wrapper (StrictMode, `onModelChange` on load, `initialize()` / `destroy()`, typed props), Angular (Reactive Forms reset, Material dialogs) and the Word Export XSS fix; error-diagnosis lists the bugs fixed by upgrading to 5.6.0.
- froala-migrate maps TinyMCE `formatpainter` / `a11ychecker` and CKEditor `formatPainter` to `paintFormat` / `accessibilityChecker` (5.6.0+).
- `scripts/validate-skills.mjs`: checks names and structure against the published packages (not runtime behaviour). PRs use the declared version; a weekly job uses the latest release.
- `tests/run-negative-tests.mjs`: the validator must catch a set of deliberately broken examples.
