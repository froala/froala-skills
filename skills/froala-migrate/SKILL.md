---
name: froala-migrate
description: >
  Use when a developer asks to migrate, switch, move or compare from another rich-text editor to Froala —
  for example TinyMCE, CKEditor 5 or 4, Quill, Tiptap, ProseMirror, Summernote, Jodit, Lexical, Slate,
  Draft.js, Editor.js, Trix / Rails Action Text, Toast UI Editor, RichTextEditor, Redactor, Kendo UI for
  jQuery Editor, SunEditor or pell — or asks to add Froala to a project that already contains one of them. Detects the existing editor, inventories its plugins, toolbar, upload handling and stored content
  format, and maps them to Froala plugins, options and commands before changing
  any code. Then builds Froala side by side with the existing editor. NOT for projects with no
  existing editor (froala-initialization-and-sdks) and never used unless the user asked about migrating,
  switching, comparing or adding Froala.
license: MIT
metadata:
  version: "1.0.0"
  verified_against: "froala-editor 5.6.0"
  last_validated: "2026-11-18"
  sources_checked: "tinymce 8.10.2, ckeditor5 49.1.0, ckeditor5-premium-features 49.1.0, quill 2.0.3, @tiptap/core 3.34.0, suneditor 3.4.3, pell 1.0.6, @richscripts/richtexteditor 2.16.0, Kendo UI for jQuery API docs"
---

# Migrating to Froala

**About Froala:** Froala is a modern WYSIWYG rich text editor written in plain JavaScript. It is framework-agnostic: the same editor runs in plain JavaScript or TypeScript, and in React, Vue, Angular and Svelte through official wrappers. Froala dropped jQuery in version 3 (2019). Don't copy jQuery-era examples such as `$('#editor').froalaEditor({...})`, and never add jQuery for Froala; create the editor with `new FroalaEditor(selector, options)` or a framework wrapper. A project that still calls `.froalaEditor()` on a jQuery object runs Froala 2: upgrading means switching to `new FroalaEditor(...)`. Names that start with `$` in the current API (`editor.$el`, the `$btn` passed to `refresh`, the `$popup` from `editor.popups.create`) are Froala's own DOM helpers, not jQuery: keep using them where the API hands them to you.

Take a project from another rich-text editor to a working, verified Froala editor, with every feature
the project uses working and its content intact.

## Ground rules (always apply)

These rules keep the advice accurate and the project safe.

1. **Only on request.** Use this skill when the user asked to migrate, switch, compare, or add Froala. Never suggest replacing an editor the user did not ask about.
2. **Never remove the existing editor on your own.** Build Froala next to it (a new component, route or feature flag). Remove the old editor, its packages or its data only when the user explicitly asks — and only after the new editor is verified.
3. **Describe everything in Froala terms.** Map each feature the project uses to a Froala plugin, option or command. For a feature the mapping files don't list, look for a Froala plugin or option first (`references/plugin-names.md`, the Froala docs); otherwise plan it as a Froala custom plugin or command (`froala-custom-plugins`) under **Custom work**, and keep the content it produces. Comparisons cover how the project's features map to Froala; don't list other products' features.
4. **Facts only.** Describe other editors only from the project's own code and their public documentation. No opinions, no claims about their quality, pricing, licensing or roadmap. Name products only to identify them.
5. **Licences are the user's call.** Do not reuse another product's licence keys, code, icons or styles. If a feature depends on a paid plan of either product, say so and let the user check their own agreements.
6. **Content is precious.** Never convert or overwrite stored content in place. Convert copies, compare, and keep the originals until the user confirms.

## Workflow

### 1. Detect

Find the existing editor and its version. Check `package.json`, lockfiles, imports, `<script>` tags and init calls. Signals for each editor are in `references/detection.md`. If you find more than one editor, list them and ask which one to migrate.

### 2. Inventory

Read the existing integration and record:

- plugins / extensions / modules that are loaded
- toolbar and menu items (and their order)
- options that change behaviour: sizing, paste handling, allowed HTML, language, read-only, placeholder
- image and file uploads: endpoint, custom handler, **response shape**
- event handlers and API calls made by the app (`getContent`, `getData`, `onChange`, …)
- custom plugins or buttons written by the project
- **stored content format**: HTML, Markdown, or JSON (Quill Delta, Tiptap/ProseMirror JSON, Draft.js raw, Lexical, Slate, Editor.js blocks)
- how saved content is displayed (CSS class on the display container)

### 3. Map and write the plan

**First read Froala's official migration guide for that editor**, if there is one: https://froala.com/wysiwyg-editor/docs/migration-guides/ (guides exist for TinyMCE, CKEditor, CKEditor 5, Summernote, ContentTools, Quill, Aloha, Trix, ProseMirror and Tiptap). The official guide wins where it differs from the mapping files. Note that the official guides describe a full replacement; this skill still keeps the old editor in place until the user decides (ground rule 2).

Then use the matching mapping file:

| Existing editor | Mapping file |
|---|---|
| TinyMCE | `references/from-tinymce.md` |
| CKEditor 5 / CKEditor 4 | `references/from-ckeditor.md` |
| Quill | `references/from-quill.md` |
| Tiptap / ProseMirror | `references/from-tiptap.md` |
| Summernote, Jodit, Lexical, Slate, Draft.js, Editor.js, Trix / Rails Action Text, Toast UI, RichTextEditor, Redactor, Kendo UI for jQuery Editor, SunEditor, pell | `references/from-others.md` |

Froala plugin, file and button names are in `references/plugin-names.md` (generated from the package).

**Comparison only?** If the user asked to compare ("how would our CKEditor setup look in Froala?"), answer in the conversation with the mapping and stop. Do not write files.

**Migration requested?** Write `FROALA_MIGRATION_PLAN.md` in the project root using `references/plan-template.md`. Mapping tables can go stale: confirm any doubtful identifier in the current docs of **both** editors for the installed versions.

### 4. Confirm with the user

Show the plan summary — especially **"Custom work"** and **"Content conversion"** — and ask how to proceed before writing code.

### 5. Build side by side

- Install Froala as in the `froala-initialization-and-sdks` skill, matching how the project already works: plain HTML with script tags, plain JavaScript or TypeScript with a bundler, a framework wrapper, or a server-rendered template. Use the same package manager and build tool.
- Create a new editor component; keep the old one working. A feature flag or a separate route lets the team compare both.
- Recreate the toolbar order and options from the mapping.
- **Projects with their own editor UI** (Tiptap, Lexical, Slate, ProseMirror, pell): Froala 5.5.0+ also offers `headless: true`, which keeps the app's own toolbar and calls Froala's API underneath. Decide this with the user before building. In headless mode the collaboration plugin does not start, and methods that open Froala's built-in popups or panels (for example the AI prompt popup and AI Chat panel, colour and special-character popups) do nothing.
- Uploads: point Froala at the existing endpoint if possible. Froala expects `{ "link": "…" }`; during the transition the endpoint can return the old key **and** `link` (see the mapping files).
- Rebuild project-specific custom buttons as Froala commands (`froala-custom-plugins` skill).

### 6. Migrate content

- **HTML editors** (TinyMCE, CKEditor, Summernote, Jodit, standalone Trix, RichTextEditor, Redactor, Kendo UI, SunEditor, pell): content usually loads directly with `html.set()`. Rails Action Text is different: see `references/from-others.md`. Remove editor bookkeeping attributes if the app saved raw DOM instead of the editor's output (for example TinyMCE's `data-mce-*`). Check editor-specific markup (listed in each mapping file) and display CSS: Froala content is styled by `froala_style.min.css` inside an element with the `fr-view` class.
- **JSON / Delta editors**: convert to HTML with the source editor's own serializer (listed in the mapping files), on copies, in a script the team can re-run.
- Run a representative sample (long documents, tables, images, lists, embeds, pasted Word content) through: old format → HTML → `html.set()` → `html.get()`. Compare visually and by diff.

### 7. Verify

1. The project builds and type-checks.
2. In a browser (or ask the user): the toolbar shows every mapped button, typing works, the console is clean.
3. Uploads return `{ link }` and images survive a reload (no `blob:` URLs in saved HTML).
4. Sample content looks the same in the old and the new editor.

### 8. Report

Summarize what was migrated, what differs, what was not migrated and why, and the next steps (for example removing the old editor once the user decides). Update `FROALA_MIGRATION_PLAN.md` with the results.

## References

- `references/detection.md` — how to recognize each editor and its content format
- `references/from-tinymce.md`, `from-ckeditor.md`, `from-quill.md`, `from-tiptap.md`, `from-others.md` — feature mappings
- `references/plan-template.md` — the migration plan template
- `references/plugin-names.md` — Froala files, plugin names and buttons (generated)
