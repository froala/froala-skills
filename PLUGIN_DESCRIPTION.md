# Froala Agent Skills

Froala is a modern, framework-agnostic WYSIWYG rich text editor written in plain JavaScript (no jQuery since version 3). These portable skills make an AI coding agent an expert on Froala WYSIWYG editor development — initialization, events, custom plugins, Filestack cloud storage integration, and error diagnosis.

---

## What It Does

These skills give an agent deep, structured knowledge of the Froala editor API. Instead of searching documentation, developers get accurate, framework-specific answers directly in their coding workflow.

Written in the open `SKILL.md` format, so they work in Claude Code, Cursor, Codex, GitHub Copilot, and any other agent that supports it.

**No extra server required.** Everything works through skills — the right Froala API context is surfaced based on what you're working on.

---

## Skills

| Skill | When it activates | What it provides |
|-------|-------------------|------------------|
| `froala-initialization-and-sdks` | Installing, configuring or licensing Froala in plain JS/TS, a framework wrapper or another official integration | Installation for vanilla JS/TS, React, Next.js, Vue, Nuxt, Angular, Svelte; bundles and plugin names; toolbar and theme config; licensing; SSR rules |
| `froala-methods-and-events` | Writing event listeners, getting/setting HTML content, intercepting keyboard input, or accessing the `editor` instance | Event listener syntax; safe HTML get/set; paste cleanup config; React ref readiness |
| `froala-custom-plugins` | Registering custom plugins, creating toolbar buttons, building floating popups, or extending formatting | Custom plugin boilerplate; command and dropdown registration; SVG icon registration; popups without inline handlers; plugin load order |
| `froala-filestack-integration` | Configuring image/file upload through Filestack, or replacing the default uploader | Official `filestack` plugin setup via `filestackOptions` (never restrict `pluginsEnabled` to `['filestack']`); manual `image.beforeUpload` interception that handles every dropped file |
| `froala-ai-assist` | Adding AI writing features: prompts, tone, translate, improve writing, AI Chat, autocomplete | Required terms option; backend proxy through `aiAssistRequest`; streaming and conversation continuity; inline-suggestion defaults |
| `froala-document-features` | Word import/export, Markdown, Track Changes, real-time collaboration | Dependencies and version gates; Markdown mode rules; collaboration roles; verification steps |
| `froala-error-diagnosis` | Hitting Froala errors, broken toolbars, or features that silently do nothing | Symptom-indexed diagnosis: missing buttons, unstyled editors, SSR errors, uploads, licensing, Word/PDF export, TypeScript |
| `froala-migrate` | Migrating, switching or comparing from another rich-text editor | Detection, feature mapping to Froala, comparison in the conversation or a migration plan, side-by-side build, content conversion on copies |
| `froala-upgrade` | Upgrading Froala from v2/v3/v4 to v5, or to a newer 5.x release | Version detection, breaking changes for each major version, version-gated features, upgrading the core and wrapper together, saved-content round-trip check |

---

## Use Cases

### 1. Set up Froala in a React app

> **User:** "How do I add Froala to my React component with a custom toolbar?"

`froala-initialization-and-sdks` activates and provides a complete React component using `react-froala-wysiwyg` with the correct `config` prop and toolbar button list. The wrapper destroys the editor on unmount, so no `useEffect` cleanup is needed.

---

### 2. Capture content changes

> **User:** "How do I listen for content changes in the Froala editor?"

`froala-methods-and-events` activates and shows the correct `events.on('contentChanged', ...)` syntax along with safe HTML extraction via `editor.html.get()`.

---

### 3. Build a custom toolbar button

> **User:** "I want to add a custom button to the Froala toolbar that inserts a special HTML block."

`froala-custom-plugins` activates and provides the full plugin registration boilerplate: `FroalaEditor.PLUGINS['myPlugin']`, `FroalaEditor.DefineIcon`, `FroalaEditor.RegisterCommand`, and toolbar config.

---

### 4. Upload images to Filestack instead of a local server

> **User:** "How do I make Froala upload images to Filestack instead of my own server?"

`froala-filestack-integration` activates and recommends the official Froala Filestack plugin — already included in the `pkgd` bundles and configured through `filestackOptions` — with the manual `image.beforeUpload` interception path for cases the plugin doesn't cover.

---

### 5. Diagnose a button that does nothing

> **User:** "My toolbar button shows up but clicking it does nothing."

`froala-error-diagnosis` activates and works through the likely causes: `RegisterCommand` running after `new FroalaEditor`, the `pluginsEnabled` allowlist, and `this` context loss in callbacks.

---

## Installation

**Any supported agent:**

```bash
npx skills add froala/froala-skills
```

**Claude Code plugin marketplace:**

```
/plugin marketplace add froala/froala-skills
/plugin install froala@froala-skills
```

See the README for manual installation and local development setup.

---

## Why These Skills Exist

Froala has a rich but sprawling API. Developers frequently hit issues with initialization order, event binding timing, custom plugin boilerplate, upload interception, and failures that surface no error at all. These skills encode the solutions to those recurring problems in a structured form — so an agent gives correct, specific answers instead of generic WYSIWYG advice.
