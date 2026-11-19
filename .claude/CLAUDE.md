# froala-skills: maintainer guide

This repo ships Agent Skills (`skills/<name>/SKILL.md`). AI coding agents load them to answer Froala WYSIWYG editor questions. An agent repeats whatever a skill says, so a wrong option name in a skill turns into broken code in a customer's project. Accuracy is the product.

## Accuracy rules

- **Verify against primary sources only:** the froala.com/wysiwyg-editor/docs pages (options, events, methods, plugins, framework guides), the Froala changelog, npm package metadata, and the published `froala-editor` package contents. Blogs, forum answers and model memory don't count.
- **Never invent an API.** If an option, event, method, button name or file path can't be confirmed, remove it or mark it clearly. Don't guess.
- **Confirm a name exists in the package.** When docs and code disagree, `npm pack froala-editor` and grep `js/` and `js/plugins/`.
- **Pin versions in examples.** CDN URLs use an exact version. Record the Froala version a skill was last verified against (see "Verification log" below).
- **Keep frontmatter triggers honest.** Every token in a skill's `description` must be a real Froala API or a real error string, because agents use it to decide when to load the skill.
- **Avoid contradictions between skills.** Bundle contents, the license `key` option, plugin load order and upload response shape appear in several skills. After changing one, grep the others.

## Keep the metadata in sync

When you add, remove or rename a skill, update all of these together:
- `README.md` (skill list and project structure)
- `PLUGIN_DESCRIPTION.md`
- `skills.sh.json` (groupings)
- `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` descriptions
- root `plugin.json`

Then run `claude plugin validate . --strict`. Don't put a `CLAUDE.md` at the repo root. The repo root is the plugin root, so the strict validator rejects it. This guide lives at `.claude/CLAUDE.md`, which Claude Code still loads as project instructions. The "No icon" plugin-directory warning comes from earlier work and doesn't fail validation.

## Re-verifying the skills

Use the `froala-skill-verifier` agent (`.claude/agents/froala-skill-verifier.md`) once per skill or pair of skills, in parallel. Each run should report every change with its source URL. Re-verify after each Froala minor release.

## Git

Work on a branch and merge through a PR to `master`.

## Verification log

| Date | Froala version | Scope | PR |
|---|---|---|---|
| 2026-11-19 | 5.6.0 | All 7 skills | [#7](https://github.com/froala/froala-skills/pull/7) |

## Lessons learned

Mistakes found in past reviews, so they aren't repeated:

- **Don't assume the major version.** The 2026-11 review prompt said "v4.x", but `froala-editor` was already at 5.6.0. Always read the version from npm first.
- **`DefineIcon` with `template: 'svg'` takes `PATH` (and an optional `VIEWBOX`), not `SVG`.** A raw `SVG:` key is ignored, and the icon renders empty.
- **Don't use a bare letter shortcut that collides with a built-in command.** `RegisterShortcut(KEYCODE.K, …)` silently overrides Ctrl+K `insertLink`. Also, a custom `shortcutsEnabled` or `pluginsEnabled` list must include the custom command or plugin.
- **`htmlAllowedTags`, `htmlAllowedAttrs` and `htmlRemoveTags` are global content rules, not paste rules.** The paste-specific options are `pasteDeniedTags`, `pasteDeniedAttrs` and `pasteAllowedStyleProps`.
- **No inline `onclick="fn()"` in popup templates.** Bind with `editor.events.bindClick($popup, selector, fn)`.
- **A button for an unregistered command, or for a plugin left out of `pluginsEnabled`, does not render at all.** It's a "missing button", not a "button does nothing". "Does nothing" usually means an arrow-function `callback` (which loses `this`) or a `commands.before` handler returning `false`.
- **Uploads don't fail silently.** A bad response shape fires `image.error` (code 2: no link, 3: server error, 4: parse failure). Point people to that event.
- **Calling `html.get()` before init throws.** It doesn't return an empty string. Init is deferred with `setTimeout(0)`.
- **A selector that matches zero or several elements makes `new FroalaEditor` return an array**, so `editor.html` is undefined.
- **The license UX changed in 5.6.0.** There's a one-line notice beside "Powered by Froala" plus a console message, and localhost is no longer exempt. Re-check the license text on every release.
- **Next.js App Router:** you can't use `dynamic(..., { ssr: false })` in a Server Component. Wrap it in a `'use client'` component.
- **Bump CDN versions in every skill together**, and on npm install `froala-editor` at the exact version the framework wrapper pins.
- **Packaged bundles leave out** `track_changes`, `edit_in_popup`, `trim_video` and every `third_party` plugin.
- **Framework wrapper facts go stale quickly.** In 5.6.0:
  - Vue is Vue 3 only. Use `v-model:value`, and use a namespace import under Vite 8.
  - Angular apps use standalone components by default.
  - Svelte requires Svelte 5 per npm. The docs page says 3–5, so trust npm metadata.

  Check each wrapper's README on npm, not memory.
- **The Filestack plugin needs the filestack-js 3.x `<script>` globals even in bundler apps.** It also overwrites the picker's `onOpen`/`onUploadDone`/… callbacks; use the `filestack.*` events instead.
- **State version gates for newer features.** Examples: Export to Word 4.7.0+, Import from Word 5.0.0+, AI Assist 5.1.0+, AI Chat and `getMarkdown`/`setMarkdown` 5.4.0+, image generation 5.5.0+. Find a gate by diffing tarballs across versions.
- **AI defaults have side effects.** `inlineSuggestions` and `aiSpeechToText` default to `true` and send requests through `aiAssistRequest`. AI features are hidden with `toolbarInline: true`. `aiShortCuts` covers only tone and translate.
- **In collaboration, an `editor` role *can* suggest.** Only `viewer` can't. Async mode means no `realTime.syncUrl`, not `realTime: null`.
- **Markdown:** `setMarkdown` only displays its content while markdown mode is on (`markdown.toggle()`).
- **Plan and pricing wording** (for example, what Professional allows) comes from cart.froala.com, and needs re-checking each release.
