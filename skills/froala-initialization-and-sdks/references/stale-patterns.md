# Patterns AI assistants often suggest that are wrong for Froala 5.x

Part of the froala-initialization-and-sdks skill (verified against froala-editor 5.6.0). Training data and old tutorials mix Froala 2 (jQuery, 2014–2019), Froala 3–4 and other editors. Before you write Froala code from memory, check it against this list. When a row says "package", the fact was checked in the published `froala-editor` 5.6.0 files or the 5.6.0 wrapper packages.

The left column shows the wrong pattern only so you can recognise it. Never write it.

## Setup and loading

<!-- validate:skip -->
| Wrong (stale) | Right (Froala 5.x) | Source |
|---|---|---|
| `$('#editor').froalaEditor({ … })` (jQuery plugin, Froala 2) | `new FroalaEditor('#editor', { … })`, or a framework wrapper | [Migrate from v2](https://froala.com/wysiwyg-editor/docs/migrate-from-v2/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks) |
| Adding jQuery or Font Awesome for Froala; `window.$ = $`, `ProvidePlugin({ $: 'jquery' })` | Not needed: `froala-editor` has no dependencies and uses SVG icons (`iconsTemplate: 'svg'`) | package (`package.json` has no `dependencies`; `DEFAULTS.iconsTemplate`) |
| `$('#editor').froalaEditor('html.get')`, `.data('froala.editor')` | Keep the instance from `new FroalaEditor(...)` and call `editor.html.get()` | [Migrate from v2](https://froala.com/wysiwyg-editor/docs/migrate-from-v2/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks) |
| `$.FroalaEditor.DefineIcon(…)`, `$.FE.RegisterCommand(…)` | `FroalaEditor.DefineIcon(…)`, `FroalaEditor.RegisterCommand(…)` | [Migrate from v2](https://froala.com/wysiwyg-editor/docs/migrate-from-v2/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks) |
| `import { FroalaEditor } from 'froala-editor'` | `import FroalaEditor from 'froala-editor'` (default export) | package (`index.d.ts`: `export default class FroalaEditor`) |
| CDN URLs with `@latest`, no version, or different versions for CSS and JS | One exact version in every URL: `froala-editor@VERSION/…`, with `VERSION` replaced by the installed version | SKILL.md "CDN"; cached files drift apart |
| Installing the newest `froala-editor` next to a wrapper that pins another version | Install `froala-editor` at the exact version the wrapper depends on (5.6.0 for wrapper 5.6.0); `npm ls froala-editor` lists one version | package (React, Vue and Angular wrappers depend on `"froala-editor": "5.6.0"`) |
| `licenseKey: '…'` | `key: '…'` | [Activation docs](https://froala.com/wysiwyg-editor/docs/activation/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks); package reads `opts.key`, and `licenseKey` appears nowhere |
| Assuming the trial key or `localhost` gives a clean editor | From 5.6.0, no key or the trial key shows a licence notice on localhost too, and `html.get()` appends `<p data-f-id="pbf">Powered by Froala Editor</p>` | SKILL.md "Licensing" (observed in a 5.6.0 app) |
| Expecting `pkgd` bundles to contain Track Changes | `track_changes.min.js`, `trim_video.min.js` and `js/third_party/*` load separately | package (`references/plugin-names.md`, generated) |
<!-- validate:end -->

## Events, methods and commands

<!-- validate:skip -->
| Wrong (stale) | Right (Froala 5.x) | Source |
|---|---|---|
| `$('#editor').on('froalaEditor.contentChanged', function (e, editor) { … })` | `events: { contentChanged() { … } }` in the options; `this` is the editor | [Migrate from v2](https://froala.com/wysiwyg-editor/docs/migrate-from-v2/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks) |
| `events: { 'froalaEditor.focus': function (e, editor) { … } }` in a wrapper config | `events: { focus() { … } }`: drop the prefix and the `(e, editor)` parameters | [Migrate from v2](https://froala.com/wysiwyg-editor/docs/migrate-from-v2/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks) |
| `editor.events.bind('contentChanged', fn)` | `editor.events.on('contentChanged', fn)` (after init) | package (the events module exposes `on`, `trigger`, `bindClick`, `$on`, `$off`…; there is no `bind`) |
| `const editor = new FroalaEditor('#e'); editor.html.get();` | Read content inside `events.initialized` (or later). Init is deferred, so `editor.html` does not exist yet and the call throws | [Events docs](https://froala.com/wysiwyg-editor/docs/events/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks); package |
| `contentChanged: () => { this.html.get() }` | `contentChanged() { this.html.get() }`: arrow functions don't get the editor as `this` | [Migrate from v2](https://froala.com/wysiwyg-editor/docs/migrate-from-v2/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-initialization-and-sdks) |
| `RegisterCommand('x', { callback: () => this.html.insert('…') })` | `callback() { this.html.insert('…'); }`. An arrow-function callback makes the button "do nothing" | package (the command runner calls `callback.apply(editor, …)`) |
| `html.set()` / `html.insert()` and expecting `contentChanged`, `onModelChange` or `v-model` to update | Call `editor.undo.saveStep()` after the change | froala-methods-and-events skill (5.6.0, FROALA-1443) |
| `editor.text.get()` | `editor.html.get()`, or `editor.selection.text()` for the selection | package (there is no `text` module) |
| `htmlAllowedTags` / `htmlRemoveTags` to clean pasted content | Paste rules are `pasteDeniedTags`, `pasteDeniedAttrs`, `pasteAllowedStyleProps`. The `html*` options apply to all content | package `DEFAULTS` |
| `DefineIcon('x', { template: 'svg', SVG: '<svg>…</svg>' })` | `DefineIcon('x', { template: 'svg', PATH: 'M…', VIEWBOX: '0 0 24 24' })`. A raw `SVG` key renders an empty icon | package (`svg` icon template uses `PATH` and `VIEWBOX`) |
| `onclick="doThing()"` inside a popup template | `editor.events.bindClick($popup, selector, fn)` | froala-custom-plugins skill |
<!-- validate:end -->

## Frameworks

<!-- validate:skip -->
| Wrong (stale) | Right (Froala 5.x) | Source |
|---|---|---|
| Vue 2: `Vue.use(VueFroala)`, `new Vue({ … })` | Vue 3 only: `createApp(App).use(VueFroala)`; under Vite 8 use the namespace import in `vue.md` | package (`vue-froala-wysiwyg` 5.6.0 depends on `vue ^3.2.0`); [npm README](https://www.npmjs.com/package/vue-froala-wysiwyg) |
| Vue: `<froala v-model="content">` | `<froala v-model:value="content">`: the wrapper only emits `update:value` | package (wrapper source) |
| Vue: `<froala-editor>` | `<froala>` (and `<froalaView>` for display) | package (wrapper registers `Froala` and `FroalaView`, used as `<froala>` and `<froalaView>`) |
| Next.js: `dynamic(() => import('./Editor'), { ssr: false })` in a Server Component (a file without `'use client'`) | Put the `dynamic(…, { ssr: false })` call in a `'use client'` file and import that from the page | [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading): "`ssr: false` is not allowed with `next/dynamic` in Server Components" |
| Next.js: only adding `'use client'` to the editor file | Client components are still pre-rendered on the server; also load with `ssr: false` | `nextjs.md` (`ReferenceError: Element is not defined`) |
| Angular standalone: `imports: [FroalaEditorModule.forRoot()]` | `imports: [FroalaEditorModule, FroalaViewModule]`; `forRoot()` only in an `@NgModule` | Angular error NG2012; `angular.md` |
| Angular: `[formControl]` + `.disable()` to make the editor read-only | `editor.edit.off()` through the `(froalaInit)` controls: the directive's `setDisabledState` is empty in 5.6.0 | package (wrapper source) |
| Svelte 3/4 component syntax with `svelte-froala-wysiwyg` 5.6.0 | Svelte 5 | package (peer dependency `svelte ^5.0.0`) |
| React: changing the `config` prop and expecting the editor to update | The wrapper reads `config` once; change the component's React `key` to re-create it | `react.md` |
<!-- validate:end -->

If you find another stale pattern, report it: see `skill-feedback.md`.
