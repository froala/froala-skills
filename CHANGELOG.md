# Changelog

## 1.2.0 — 2026-11-20

Hardening and agent-DX release. Still verified against `froala-editor` 5.6.0.

### Added

- **Behavioural evals** (`evals/`, 11 cases) for [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals): React + Vite setup, the license `key` option, `html.insert()` not updating `v-model`, a custom toolbar button, the image upload response, images lost after reload (`blob:` URLs), the 5.6.0 "Powered by Froala" paragraph in saved HTML, Angular `FormControl.disable()`, a pasted v2 jQuery snippet, a TinyMCE config to convert, and an old Froala 3 project. Each case runs with and without the skills. On-demand **Skill evals** workflow.
- **"Verify it works" section** in every skill: build, then check in a browser (toolbar renders, `html.get()` returns the expected HTML, no console errors), otherwise ask the user to confirm specific results.
- **initialization-and-sdks:** `references/stale-patterns.md` (wrong patterns AI assistants often suggest for Froala 5.x, each with the fix) and `references/security-and-accessibility.md` (server-side sanitising, the `DOMPurify` hook, paste options, upload checks, CSP, keyboard access, Accessibility Checker, RTL).
- **migrate:** "Already on Froala?" guidance, so agents don't propose leaving Froala when the user asked to fix or upgrade it. `from-tinymce.md` now maps every option and button TinyMCE's own setup skill configures.
- `references/skill-feedback.md` in every skill, pointing to the feedback form.
- Plugin icon, `documentationUrl` and `supportUrl`; Cursor plugin manifests (`.cursor-plugin/`); README install steps for Copilot CLI, VS Code and Cursor.
- `LICENSE` (MIT), which the manifests and skills already declared.

### Changed

- **error-diagnosis** (653 → 118 lines) is now a symptom index; details moved to `references/`. **initialization-and-sdks** (531 → 295 lines) keeps the core setup; per-framework guides moved to `references/<framework>.md`.
- Every skill is self-contained: no links into other skills, so installing one skill on its own works. froala-upgrade has its own generated `plugin-names.md`.
- Descriptions trimmed under 900 characters, with "rich text editor" / "WYSIWYG" for directory search. Removed `initPopup`, `showPopup` and `hidePopup` from the custom-plugins triggers (local example names, not Froala APIs).
- froala.com docs links carry `utm_source=froala-skills&utm_medium=agent-skill&utm_content=<skill>`, so Froala can see which skills send readers to the docs.
- **Validator:** CommonMark fence parsing (fences with an info string no longer break later checks), `module.method` pairs checked against each module's real methods, nested toolbar groups, any editor variable name, option objects with any name, Vue `:config`, `json`/`ts`/`vue`/`svelte` fences, cdnjs and `package.json` version pins, PascalCase names in inline code, frontmatter rules (name, description length and triggers, metadata), a 500-line SKILL.md budget, relative links, manifest/skill/CHANGELOG version sync and skill lists, per-category allowlist, `--fix-utm`, clean network errors, cache integrity, Windows `npm`. Negative tests use one fixture per mistake with exact expected errors, plus a fixture that must pass.
- **CI:** Node 22, actions pinned to commit SHAs, job timeouts, manifest JSON check and `claude plugin validate --strict`.

### Fixed

- **filestack-integration / migrate (TinyMCE, CKEditor):** uploading several images at once put every image after the first at the start of the document, in reverse order (the CKEditor row kept only the last image). `image.insert()` finishes asynchronously and drops the caret. The examples now insert one file at a time, wait for `image.inserted` / `image.replaced`, and call `selection.setAfter()` on the previous image. Reproduced and re-checked in headless Chromium.
- **document-features:** turn Markdown mode on before `setMarkdown()`. Calling it while the mode is off and then toggling throws in 5.6.0. Documented what `html.get()` returns in Markdown mode.
- **security-and-accessibility:** Froala only uses `DOMPurify` if it loads before Froala (or is passed as the option); `<style>` rules are copied onto elements as inline styles.
- **custom-plugins:** the verify check counts `button[data-cmd]`, because dropdown options use the same `data-cmd`.
- **migrate:** the Quill mapping used `events.blur()`, which doesn't exist; now `editor.el.blur()`.
- **upgrade:** the v2→v3 events table mapped `$el.off()` to `editor.events.off()`, which doesn't exist (the `events` module has no `off`).
- **upgrade:** links to `plugin-names.md` pointed into another skill and broke when froala-upgrade was installed alone.
- **initialization-and-sdks:** dropped the claim that `htmlUntouched: true` turns cleaning off; the package shows it only skips normalisation.
- README project tree and PLUGIN_DESCRIPTION intro now cover all nine skills.

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

### Second review (2026-11-19)

All 9 skills were re-checked against the `froala-editor` 5.6.0 package, the froala.com docs and the framework wrappers, and the findings of an earlier independent review were brought in. Changes marked *(reproduced)* were run in headless Chromium against the 5.6.0 package. The rest were checked against the package source and the docs, but not run.

#### Fixed

- **ai-assist:** dictation never reached the backend, because the client example sent the audio `Blob` through `JSON.stringify`, which turns it into `{}`. It is now base64-encoded *(reproduced)*. Streaming sends `session_id` and `webSearchUsed` after the text as newline-delimited JSON, so the CORS expose-headers problem is gone. `aiShortCuts` covers only tone and translate; `aiImproveWriting` is its own button. `toolbarInline: true` turns AI Assist off.
- **document-features:** an empty `word.beforeExport` handler in the example made every Word export fail with "Not a valid source provided!". Observe the event with `editor.events.on(name, fn, true)` instead *(reproduced)*. Listing the Track Changes sub-buttons in the toolbar showed them twice; only `trackChanges` is needed *(reproduced)*. The version-history button needs `collabConfig.versionControl`.
- **custom-plugins:** the shortcut example took Ctrl+K away from `insertLink`. It now shows the full `RegisterShortcut` signature and a Ctrl/Cmd+Shift+K example (on macOS Froala checks Cmd) *(reproduced)*. Popups bind with `events.bindClick`. Content inserted from a popup calls `undo.saveStep()` *(reproduced)*.
- **methods-and-events:** removed `events.bind`, which never existed. The paste section uses the real paste options (`pasteDeniedTags`, `pasteDeniedAttrs`, `pasteAllowedStyleProps`) with defaults from the package; the `htmlAllowed*` options are global rules, not paste rules.
- **error-diagnosis:** a bad upload response fires `image.error` (codes 1–6) and isn't silent. `html.get()` before init throws rather than returning `''`. A selector that matches zero or several elements returns an array. Next.js App Router needs the `dynamic(..., { ssr: false })` wrapper file to be `'use client'`.
- **filestack-integration:** bundler apps still need the Filestack script tags, because the plugin uses globals. The plugin overwrites the picker callbacks. Custom popup button lists must include the picker buttons. "Image appears then disappears" is really "image inserted twice".
- **migrate:**
  - CKEditor 5's simple upload adapter sends the file in the `upload` field, so set `imageUploadParam: 'upload'`.
  - Quill 2 `getSemanticHTML()` writes every space as `&nbsp;`, and HTML saved from `root.innerHTML` marks bullet lists as `<ol data-list="bullet">`. Both need post-processing.
  - Tiptap `generateHTML` throws on a missing extension.
  - Corrected the mappings for TinyMCE `content_css` and `images_upload_handler`, and CKEditor 4 `image2` captions.

#### Added

- **`froala-upgrade` skill:** v2 to v3 (removing jQuery), v3 to v4, v4 to v5, and 5.x releases. Built from Froala's migration guides and diffs of the published packages from 2.9.8 to 5.6.0. Covers version-gated features, upgrading each framework wrapper with the core, and a saved-content round-trip check.
- **methods-and-events:** saving and loading content (forms, the `save` plugin, `core.isEmpty()`), a security section (client-side cleanup is not a security boundary, sanitize on the server), read-only mode (`edit.off()`), character and word limits, and several editors on one page.
- **initialization-and-sdks:** language files and right-to-left text, accessibility, and options being read only at start (Vue reads `config` once). Agents are now told to use the skill when asked to add a rich text editor to a project that uses Froala.
- **Reference files:**
  - an AI backend (`ai-assist/references/backend-node.md`): Express 5 with auth, per-user rate limits, a model allowlist, streaming, files and dictation; tested end to end against a mock provider
  - Word import, edit and export (`document-features/references/word-workflow.md`)
  - an authenticated collaboration server (`document-features/references/collaboration-server.md`)
- **migrate references:** `content-conversion.md` (Quill, Tiptap/ProseMirror, Lexical, Draft.js, Slate, Editor.js, Yjs), `framework-wrappers.md` and `vendor-status.md` (licence and end-of-life facts quoted from each vendor). Real gaps are listed honestly, each with a workaround.
- **Live documentation section in every skill:** use the installed package first, then the docs pages, then `llms.txt`.
- **README:** install steps for each agent (Claude Code, Cursor, Copilot, Codex, Windsurf, Gemini CLI, Antigravity), each checked against that agent's docs; update commands; and an `AGENTS.md` fallback.
- **Feedback:** `.github/ISSUE_TEMPLATE/skill-feedback.yml`.
