# Froala Agent Skills

Froala is a modern, framework-agnostic WYSIWYG rich text editor written in plain JavaScript (no jQuery since version 3). These portable [Agent Skills](https://agentskills.io/home) make an AI coding agent an expert on [Froala WYSIWYG editor](https://froala.com/wysiwyg-editor/) development — initialization, events, custom plugins, uploads and storage, AI Assist, Word and Markdown workflows, Filestack, and error diagnosis.

> Checked against **froala-editor 5.6.0** (see `metadata.verified_against` in each `SKILL.md`). CI checks every pull request against that version, and a weekly job compares the skills with the latest Froala release. The validator checks names and structure (options, events, buttons, plugin names, method calls, frontmatter, versions); it cannot prove that an example behaves correctly at runtime.

The skills use the open `SKILL.md` format, so they work in Claude Code, Cursor, GitHub Copilot, OpenAI Codex, Windsurf, Gemini CLI, Google Antigravity and any other agent that supports it (see the per-agent table below). Install once and your agent answers Froala questions from structured knowledge instead of guessing.

---

## Installation

### Any supported agent (skills.sh)

```bash
npx skills add froala/froala-skills
```

The CLI detects the agents you have installed and asks which ones to install for. It places the skills in each agent's skills directory (see the table below), using symlinks to one shared copy by default. Useful flags:

| Flag | Effect |
| --- | --- |
| `-g`, `--global` | Install to your user directory (all projects) instead of the current project |
| `-s`, `--skill <name...>` | Install only the named skills, e.g. `-s froala-error-diagnosis` |
| `-a`, `--agent <agent...>` | Install only for these agents, e.g. `-a claude-code cursor` |
| `-y`, `--yes` | Skip the prompts (for scripts and CI) |

```bash
npx skills add froala/froala-skills -s froala-initialization-and-sdks -a claude-code -y
```

Requires Node.js 22.20 or later. See the [skills CLI reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).

### Claude Code plugin marketplace

```
/plugin marketplace add froala/froala-skills
/plugin install froala@froala-skills
```

The skills then load as `froala:froala-initialization-and-sdks`, `froala:froala-methods-and-events`, and so on.

### Plugin install in other agents

The same repository is also a plugin or extension for these agents:

| Agent | Install | Manifest it reads |
|---|---|---|
| OpenAI Codex | `codex plugin marketplace add froala/froala-skills`, then `codex plugin add froala@froala-skills` | `.claude-plugin/marketplace.json` and `plugin.json` ([docs](https://developers.openai.com/codex/plugins)) |
| Gemini CLI | `gemini extensions install https://github.com/froala/froala-skills` | `gemini-extension.json` ([docs](https://geminicli.com/docs/extensions/)) |
| GitHub Copilot CLI | `copilot plugin marketplace add froala/froala-skills`, then `copilot plugin install froala@froala-skills` | `.claude-plugin/marketplace.json` and `plugin.json` ([docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)) |
| VS Code (agent plugins, experimental) | Add `froala/froala-skills` to the `chat.plugins.marketplaces` setting, or run **Chat: Install Plugin from Source** | `plugin.json` / `.claude-plugin/plugin.json` ([docs](https://code.visualstudio.com/docs/copilot/customization/agent-plugins)) |
| Cursor | **Customize → From GitHub Repository** → `froala/froala-skills` | `.cursor-plugin/` ([docs](https://cursor.com/docs/plugins)) |

### Manual install, per agent

Copy each `skills/<name>/` folder you want (the folder, not just `SKILL.md`, because some skills have a `references/` folder) into your agent's skills directory:

```bash
git clone --depth 1 https://github.com/froala/froala-skills.git /tmp/froala-skills
mkdir -p .agents/skills
cp -R /tmp/froala-skills/skills/* .agents/skills/    # change the target for your agent
```

| Agent | Project directory | User (all projects) directory | Docs |
| --- | --- | --- | --- |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` | [Skills](https://code.claude.com/docs/en/skills) |
| Cursor | `.agents/skills/` or `.cursor/skills/` | `~/.agents/skills/` or `~/.cursor/skills/` | [Agent Skills](https://cursor.com/docs/context/skills) |
| GitHub Copilot (VS Code, Visual Studio, JetBrains, Copilot CLI, cloud agent) | `.github/skills/` (also reads `.agents/skills/` and `.claude/skills/`) | `~/.copilot/skills/` (also `~/.agents/skills/`) | [About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills), [VS Code](https://code.visualstudio.com/docs/copilot/customization/agent-skills) |
| OpenAI Codex (CLI, IDE extension) | `.agents/skills/` | `~/.agents/skills/` | [Skills](https://learn.chatgpt.com/docs/build-skills) |
| Windsurf (now Devin desktop) | `.devin/skills/`, or `.agents/skills/` (legacy `.windsurf/skills/` is still read) | `~/.config/devin/skills/` or `~/.agents/skills/` | [Skills](https://docs.devin.ai/desktop/cascade/skills) |
| Gemini CLI | `.agents/skills/` or `.gemini/skills/` | `~/.agents/skills/` or `~/.gemini/skills/` | [Agent Skills](https://geminicli.com/docs/cli/skills/) |
| Google Antigravity | `.agents/skills/` | `~/.gemini/config/skills/` | [Skills](https://antigravity.google/docs/skills) |

Notes:

- **One folder for most agents.** Every agent above except Claude Code reads the project folder `.agents/skills/`, so a single copy there covers Cursor, Copilot, Codex, Windsurf, Gemini CLI and Antigravity. Claude Code needs its own copy in `.claude/skills/` (`npx skills add` handles this for you).
- **Claude Code** loads project skills from `.claude/skills/` in the start directory and every parent up to the repository root. Commit that folder to share the skills with your team.
- **Copilot cloud agent**: commit the skills to the repository. Per GitHub's docs, personal skills for cloud sandbox sessions must be in `.copilot/skills` in your dotfiles repository.
- Start a new agent session (or reload the window) after copying so the agent picks up the skills.
- **Other agents.** `npx skills add` also installs into about 70 other agents that read `SKILL.md`, including Kiro, Cline, Roo Code, JetBrains Junie, Zed, Amp, OpenCode, Goose, Continue, Augment, Trae, Qwen Code, OpenHands and Warp. Pass `-a <agent>` or let the CLI detect them; the [skills CLI agent list](https://github.com/vercel-labs/skills/blob/main/docs/agents.md) has each agent's directory.

### From a website (Agent Skills Discovery)

Each GitHub release attaches an [Agent Skills Discovery](https://agentskills.io/) index (`index.json` plus one `.tar.gz` per skill, each with a SHA-256 digest). Once it is hosted at `https://<site>/.well-known/agent-skills/`, `npx skills add https://<site>` installs the skills from there and rejects any archive whose digest does not match. Build it locally with `node scripts/build-discovery-index.mjs`. Host the files on a normal web server or CDN: the CLI downloads the archives in parallel and silently skips any that fail to download.

### Agents without `SKILL.md` support (`AGENTS.md` fallback)

If your agent does not load skills but reads [`AGENTS.md`](https://agents.md/) (or its own rules file), copy the skills into the repository, for example under `.agents/skills/`, and point the agent at them from `AGENTS.md` at the repository root:

```markdown
## Froala WYSIWYG editor
Before writing or changing Froala editor code, read the matching guide and follow it:
- Setup, frameworks, toolbar, license key: .agents/skills/froala-initialization-and-sdks/SKILL.md
- Events, html.get/set, paste: .agents/skills/froala-methods-and-events/SKILL.md
- Custom buttons and plugins: .agents/skills/froala-custom-plugins/SKILL.md
- Upload endpoints, server SDKs, S3/Azure, image manager: .agents/skills/froala-uploads-and-storage/SKILL.md
- Filestack uploads: .agents/skills/froala-filestack-integration/SKILL.md
- AI Assist: .agents/skills/froala-ai-assist/SKILL.md
- Word, Markdown, Track Changes, collaboration: .agents/skills/froala-document-features/SKILL.md
- Migrating from another editor: .agents/skills/froala-migrate/SKILL.md
- Upgrading Froala (v2/v3/v4 to v5, 5.x releases): .agents/skills/froala-upgrade/SKILL.md
- Errors and broken behaviour: .agents/skills/froala-error-diagnosis/SKILL.md
```

The agent then reads a skill only when the task needs it, instead of loading all nine into every prompt.

### Updating

| Installed with | Update with |
| --- | --- |
| `npx skills add` | `npx skills check` to see what changed, then `npx skills update` (add `-g` for user-level installs, `-y` to skip prompts) |
| Claude Code marketplace | `/plugin`, **Marketplaces** tab, select `froala-skills`, **Update marketplace**; or in your shell `claude plugin update froala@froala-skills`. Third-party marketplaces do not auto-update by default; you can turn auto-update on in the same tab. |
| Manual copy | Pull the repository again and re-copy the `skills/` folders |

In Claude Code, run `/reload-plugins` or start a new session to load the new version. Note that `claude plugin marketplace update` run with no name only refreshes the marketplace listings and leaves installed plugins at their current version.

### Local / Development

From a clone of this repository:

```
/plugin marketplace add /path/to/froala-skills
/plugin install froala@froala-skills
```

Validate before pushing:

```
claude plugin validate . --strict
node scripts/validate-skills.mjs            # checks every skill against the declared froala-editor version
node scripts/validate-skills.mjs --froala latest   # checks against the latest release
node tests/run-negative-tests.mjs           # proves the validator still catches known-bad examples
node scripts/validate-skills.mjs --write    # regenerates references/plugin-names.md
```

---

## Skills

The nine skills activate automatically based on your code and questions. You don't invoke them manually — your agent matches the context against each skill's description.

### `froala-initialization-and-sdks`

**Activates when** you import Froala packages, use framework wrappers, or ask about setup.

Covers:
- Installation for Vanilla JS/TS, React, Next.js, Vue 3, Nuxt, Angular, Svelte and SvelteKit
- Toolbar configuration and layout options
- Editor lifecycle and proper destroy/cleanup patterns
- Licence key setup (the `key` option) and what changes without a key, per version

**Trigger keywords:** `froala-editor`, `react-froala-wysiwyg`, `vue-froala-wysiwyg`, `angular-froala-wysiwyg`, `new FroalaEditor(`, `toolbarButtons`, `heightMin`

---

### `froala-methods-and-events`

**Activates when** you work with editor events, get/set content, or intercept keyboard input.

Covers:
- Event listener syntax (`contentChanged`, `focus`, `blur`, `keydown`, etc.)
- Safe HTML get/set via `editor.html.get()` and `editor.html.set()`
- Paste cleanup configuration to strip Word/Google Docs formatting
- Fixes for calling API methods before editor initialization

**Trigger keywords:** `events.on`, `events.trigger`, `contentChanged`, `html.get`, `html.set`, `pastePlain`, `paste.afterCleanup`

---

### `froala-custom-plugins`

**Activates when** you register custom plugins, create toolbar buttons, build popups, or extend formatting.

Covers:
- Full plugin boilerplate (`FroalaEditor.PLUGINS`, `RegisterCommand`, `DefineIcon`)
- Custom dropdown buttons with option lists
- Floating popup panels
- State synchronization between custom plugin and editor
- SVG icon registration and shortcut key binding
- Plugin loading order requirements

**Trigger keywords:** `FroalaEditor.PLUGINS`, `RegisterCommand`, `DefineIcon`, `RegisterShortcut`, `popups.create`, `POPUP_TEMPLATES`, `events.bindClick`

---

### `froala-uploads-and-storage`

**Activates when** you build or configure where the editor stores images, files and videos.

- The upload request and the `{ "link": ... }` response, `imageUploadParams`, `requestHeaders`, size and type limits, and the `image.error` codes
- The official server SDKs (Node, PHP, Python, .NET, Java, Ruby), with the checks they leave to you: they trust the client's file name and content type
- Direct browser uploads to S3 (`imageUploadToS3`) and Azure Blob (`imageUploadToAzure`), signed on the server so the secret never reaches the browser
- Deleting stored files on `image.removed` / `file.unlink` / `video.removed`, and why undo and `html.set()` make that unsafe without a save-time cleanup
- Image manager load and delete endpoints

**Trigger keywords:** `imageUploadURL`, `fileUploadURL`, `videoUploadURL`, `imageUploadToS3`, `imageUploadToAzure`, `requestHeaders`, `image.removed`, `file.unlink`, `imageManagerLoadURL`, `imageManagerDeleteURL`, `wysiwyg-editor-node-sdk`

---

### `froala-filestack-integration`

**Activates when** you wire Filestack into Froala for image or file uploads — either via the official plugin or manual upload interception.

Covers two approaches:

**Approach 1 — Official Froala Filestack Plugin (recommended):**
- Enabling the native `filestack` plugin (it is in the `pkgd` bundles — do **not** set `pluginsEnabled: ['filestack']`, which disables every other plugin)
- `filestackOptions` configuration (`filestackAPI`, `uploadToFilestackOnly`, `pickerOptions`)
- Plugin events: `filestack.uploadedToFilestack`, `filestack.uploadFailedToFilestack`, `filestack.filestackPickerOpened`, `filestack.filestackPickerClosed`
- Required CDN dependencies (Filestack JS 3.x, drag-and-drop, transforms UI)

**Approach 2 — Manual Interception (advanced):**
- Intercepting `image.beforeUpload` to cancel Froala's default uploader
- Passing files to `filestack.client.upload()` and injecting the CDN URL back with `editor.image.insert()`
- React-specific wiring with correct `this` context
- Applying Filestack CDN transformations (resize, format conversion) before insert
- Common pitfalls (missing `return false`, arrow function `this` context loss, wrong Filestack JS version)

**Trigger keywords:** `filestackOptions`, `filestackAPI`, `uploadToFilestackOnly`, `pickerOptions`, `filestack.uploadedToFilestack`, `filestack.filestackPickerOpened`, `image.beforeUpload`, `file.beforeUpload`, `filestackcontent.com`

---

### `froala-error-diagnosis`

**Activates when** you encounter Froala errors, broken behavior, or something that silently does nothing.

Covers:
- Toolbar button missing or not showing (missing plugin JS, `pluginsEnabled` allowlist, wrong button name, v4 group object)
- Editor renders but looks broken or unstyled (missing CSS imports)
- `FroalaEditor is not defined` / `is not a constructor` (script load order, wrong import style)
- Plugin method undefined (`editor.image is undefined`, `editor.link is undefined`) — plugin not imported or called before `initialized`
- Editor does not mount / element not found (selector mismatch, DOM not ready)
- Licence notice next to "Powered by Froala" (missing, trial, invalid or expired `key`; the option is `key`, not `licenseKey`), and the 5.6.0 "Powered by Froala Editor" paragraph in saved HTML
- Toolbar button renders but does nothing (plugin defined after the editor started, arrow-function `callback`, a `commands.before` handler returning `false`)
- Image/file upload fails (`image.error` codes for a missing `link`, server errors or unparsable responses; CORS) and images lost after reload (temporary `blob:` URLs)
- `html.get()` throws or returns stale content (called before the editor is initialized)
- Framework issues: Next.js and SSR errors, Angular budget and NG2012, Vue on Vite 8, TypeScript TS7016, content inserted from code missing from the model
- `this` is undefined or wrong in event handlers (arrow function context loss)
- Quick diagnosis checklist for unknown issues

**Trigger keywords:** `toolbar missing`, `button not showing`, `plugin not loading`, `editor broken`, `FroalaEditor is not defined`, `is not a constructor`, `html is undefined`, `image is undefined`, `Cannot read property`, `pluginsEnabled`

---

### `froala-ai-assist`

**Activates when** you add AI writing features — prompts, tone, translate, improve writing, AI Chat, speech-to-text or autocomplete.

Covers:
- The required `aiSupplementalTermsAccepted: true`
- Routing requests through your own backend with `aiAssistRequest` (keeps provider API keys off the client)
- Provider choice: OpenAI, Google Gemini, Anthropic, Groq or your own service
- AI Chat model picker, streaming, file context, speech-to-text, inline suggestions

**Trigger keywords:** `aiSupplementalTermsAccepted`, `aiAssistRequest`, `aiChatModels`, `aiAssist`, `aiChatAssistant`, `inlineSuggestions`

---

### `froala-document-features`

**Activates when** you work with Word import/export, Markdown, Track Changes or real-time collaboration.

Covers:
- Word `.docx` import (browser via mammoth.js, or server-side) and export
- Markdown with `markdown.getMarkdown()` / `markdown.setMarkdown()`
- Track Changes — including that `track_changes.min.js` is **not** in the packaged bundles
- Collaborative editing: `collabConfig`, roles, suggestion mode, comments and version history

**Trigger keywords:** `import_from_word`, `export_to_word`, `markdown.getMarkdown`, `trackChanges`, `collabConfig`, `syncUrl`

---

### `froala-migrate`

**Activates when** you ask to migrate, switch or compare from another rich-text editor to Froala, or to add Froala to a project that already has one.

Covers:

- Detection of TinyMCE, CKEditor 5/4, Quill, Tiptap, ProseMirror, Summernote, Jodit, Lexical, Slate, Draft.js, Editor.js, Trix / Rails Action Text, Toast UI Editor, RichTextEditor, Redactor, Kendo UI for jQuery Editor, SunEditor and pell
- Feature, toolbar, option and upload mappings: answered in the conversation for a comparison, or written to `FROALA_MIGRATION_PLAN.md` when a migration is requested
- Starts from Froala's official migration guides where they exist; offers headless mode for projects with their own editor UI
- Every feature the project uses is mapped to a Froala plugin, option or command, or planned as a Froala custom plugin
- Content conversion (HTML, Markdown, Quill Delta, Tiptap/ProseMirror JSON, Draft.js, Lexical, Editor.js)
- Froala built side by side — the existing editor is never removed unless you ask

**Trigger keywords:** `migrate to Froala`, `switch from TinyMCE`, `replace CKEditor`, `Quill to Froala`, `Tiptap to Froala`

---

### `froala-upgrade`

**Activates when** you upgrade an existing Froala integration: a major version (v2, v3 or v4 to v5) or a 5.x release.

Covers:

- Detecting the installed version and wrapper, then the breaking changes for each step: removing jQuery (v2 to v3), new plugins and table defaults (v3 to v4), and a new licence key and new plugins (v4 to v5)
- Features that require a minimum version (Word export and import, AI Assist, collaboration, Markdown API, headless mode) and the 5.6.0 licence-notice behaviour
- Upgrading the core package and its framework wrapper together, because the wrappers pin `froala-editor`
- Checking that saved content comes back unchanged after the upgrade, and a staged rollout

**Trigger keywords:** `upgrade Froala`, `update froala-editor`, `froala v4 to v5`, `$('#editor').froalaEditor(`

---

## Example Interactions

**"How do I add Froala to my React app with a dark theme?"**
→ `froala-initialization-and-sdks` activates → Complete React component with `react-froala-wysiwyg`, config prop, and `theme: 'dark'`

**"How do I listen for content changes and get the HTML?"**
→ `froala-methods-and-events` activates → `contentChanged` event with `editor.html.get()` example

**"I want a custom toolbar button that inserts a signature block."**
→ `froala-custom-plugins` activates → Full `FroalaEditor.PLUGINS` + `RegisterCommand` boilerplate

**"How do I make Froala upload images to Filestack instead of my server?"**
→ `froala-filestack-integration` activates → Recommends the official Froala Filestack plugin with `filestackOptions` config, or manual `image.beforeUpload` interception + `client.upload()` + `editor.image.insert()` wiring for advanced cases

**"How do I add AI writing to Froala using our own OpenAI key?"**
→ `froala-ai-assist` activates → `aiAssistRequest` routed through your backend, with `aiSupplementalTermsAccepted: true` and a note on why the browser-direct example is prototype-only

**"How do I let users import a Word document into the editor?"**
→ `froala-document-features` activates → `import_from_word` with mammoth.js for client-side conversion, size and file-type limits, and the import events

**"My toolbar button shows up but clicking it does nothing."**
→ `froala-error-diagnosis` activates → Checks whether the plugin was defined after the editor started or is missing from `pluginsEnabled`, an arrow-function `callback` (Froala calls it with `this` set to the editor), and a `commands.before` handler returning `false`

---

## Why These Skills Exist

Froala has a rich but sprawling API. Developers repeatedly hit the same problems: initialization order, event binding timing, custom plugin boilerplate, upload interception, and failures that produce no error at all. These skills encode the solutions to those recurring problems in a structured form, so an agent gives correct, Froala-specific answers instead of generic WYSIWYG advice.

---

## How the skills are kept accurate

- **Package-checked identifiers.** `scripts/validate-skills.mjs` checks every option, event, method (as `module.method` pairs), button, plugin name, command and file path in the skills against the published `froala-editor` package, plus frontmatter, links, line budgets and manifest versions. CI runs it on every PR and weekly against the latest Froala release.
- **Negative tests.** `tests/run-negative-tests.mjs` feeds the validator deliberately broken skills and checks it reports each mistake.
- **Behavioural evals.** `evals/` holds [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals) cases: real developer prompts, graded on the code the agent writes, each run with and without the skills so the improvement is measured. Run them with `claude plugin eval .` or the **Skill evals** workflow.

---

## Project Structure

```
froala-skills/
├── .claude-plugin/
│   ├── plugin.json         # Claude Code plugin manifest (icon, links)
│   └── marketplace.json    # Marketplace entry (also read by Copilot CLI)
├── .cursor-plugin/         # Cursor plugin + marketplace manifests
├── gemini-extension.json   # Gemini CLI extension manifest
├── assets/icon.png         # Plugin icon
├── skills/
│   └── <skill-name>/
│       ├── SKILL.md
│       ├── references/     # loaded on demand: per-framework guides, generated
│       │                   # plugin-names.md, skill-feedback.md, …
│       └── scripts/        # check-froala.mjs (generated; init, error-diagnosis, upgrade)
├── evals/                  # claude plugin eval cases (results/ is git-ignored)
├── scripts/
│   ├── validate-skills.mjs     # Checks skills against the published froala-editor package
│   ├── check-froala.mjs        # Source of the agent-run project checker copied into skills
│   ├── build-discovery-index.mjs # Agent Skills Discovery index for releases
│   └── validate-allowlist.json # Non-Froala names the validator accepts, with reasons
├── tests/
│   ├── fixtures/           # Deliberately broken (and one valid) skill sets
│   ├── run-negative-tests.mjs
│   └── check-froala.test.mjs
├── .github/
│   ├── workflows/validate-skills.yml  # Validator, tests and plugin validation on every PR, weekly
│   ├── workflows/evals.yml            # Behavioural evals, on demand
│   ├── workflows/release.yml          # Attaches the discovery index to each release
│   └── ISSUE_TEMPLATE/                # Skill feedback form
├── plugin.json             # Cross-agent manifest (agent-plugins.org; Codex, Copilot, VS Code)
├── skills.sh.json          # Grouping metadata for the skills.sh directory
├── CHANGELOG.md
├── LICENSE
├── PLUGIN_DESCRIPTION.md
└── README.md
```

---

## Feedback

If an agent gave a wrong or outdated Froala answer while using these skills, [open a skill feedback issue](https://github.com/froala/froala-skills/issues/new?template=skill-feedback.yml) with the prompt, the output and what you expected. Do not paste license keys or other secrets.

---

## License

[MIT](LICENSE)
