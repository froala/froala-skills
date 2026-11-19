# Converting and preserving stored content

Froala stores and loads **HTML** (`html.get()` / `html.set()`). Content saved by HTML editors usually
loads as it is; JSON formats must be converted to HTML first. In both cases, convert **copies**, keep the
originals, and let the user approve before anything is written back.

## Rules for every conversion script

- Read from the database (or an export), write to a **new** column, table or file. Never overwrite the source.
- Make it re-runnable and deterministic: same input, same output. Log every document that fails, with its ID; never skip silently.
- Run it on a sample first: long documents, tables, nested lists, images, embeds, content pasted from Word / Google Docs, and the oldest documents (older editor versions wrote different markup).
- Use the **source editor's own serializer** with the **same configuration the app uses** (extensions, nodes, formats). A generic converter loses whatever the app customized.
- Keep a report per document: converted / converted with warnings / failed, plus counts of images, links, tables and embeds before and after.

## Converting JSON formats to HTML

Recipes below were run against the versions named. The code uses the source editor's APIs, so it is
not checked by the Froala validator.

<!-- validate:skip -->
### Quill Delta (quill 2.0.3)

There is no Delta → HTML function outside a Quill instance: load the Delta into Quill and read
`getSemanticHTML()`. Run it **in a real browser** (an admin page, or headless Chromium through Playwright).
In jsdom the conversion runs, but code blocks come out empty, because Quill exports them through
`innerText`, which jsdom does not implement.

```js
// Runs in a browser page that has loaded Quill with the same formats/modules the app registers.
const quill = new Quill(document.createElement('div'));
function deltaToHtml(delta) {
  quill.setContents(delta, 'silent');
  return quill.getSemanticHTML();
}
```

What `getSemanticHTML()` produces in Quill 2.0.3 (checked in `core/editor.js`, `formats/video.js`, `formats/formula.js`) and how to post-process it:

| Quill output | Fix in the migration script |
|---|---|
| **Every** space in text is written as `&nbsp;` | Replace `&nbsp;` with a normal space, keeping only runs of two or more spaces. Otherwise lines no longer wrap |
| Videos become `<a href="URL">URL</a>` (not an iframe) | Turn those links back into `<iframe src="URL">` embeds, or let users re-embed them with Froala's `insertVideo` |
| Formulas become `<span>LaTeX source</span>` | Plan a math solution first (see "gaps" in `from-quill.md`) |
| Code blocks become `<pre data-language="…">` | Loads in Froala as `<pre>`; map languages if the project uses `codeSnippet` |
| `ql-align-*`, `ql-indent-*`, `ql-size-*`, `ql-font-*`, `ql-direction-rtl` classes | Convert to inline styles (`text-align`, `margin-left`/`padding-left`, `font-size`, `font-family`, `dir="rtl"`) or keep Quill's CSS for those classes on display pages |

**Which HTML did the app save?** `react-quill-new` (by default) and `ngx-quill` (`format="html"`) save
`getSemanticHTML()`. The original `react-quill` (Quill 1) and code that reads `quill.root.innerHTML` save
Quill's internal DOM. With **Quill 2** that internal DOM writes **bullet lists as
`<ol><li data-list="bullet">`**, nests lists through a `ql-indent-N` class, puts `<span class="ql-ui">` inside
list items and writes code blocks as `<div class="ql-code-block">`. Load such HTML into Quill 2
(`quill.setContents(quill.clipboard.convert({ html }))`) and export it with `getSemanticHTML()`; loaded
directly, the bullet lists show as numbered lists in Froala. Quill 1 internal HTML uses real `<ul>` / `<ol>`
but flat lists with `ql-indent-N` classes, so nested lists need the same treatment.

### Tiptap JSON (@tiptap/html 3.34.0)

```js
// Node.js: the /server entry needs happy-dom installed. In the browser import from '@tiptap/html'.
import { generateHTML } from '@tiptap/html/server';
import StarterKit from '@tiptap/starter-kit';
// …plus every other extension the app registers, with the same options.

const html = generateHTML(doc, [StarterKit /*, Image, Table, …, custom nodes */]);
```

A node or mark whose extension is missing makes `generateHTML` throw (`Unknown node type: mention`):
collect those documents, add the extension (or a stub with the same name and a `renderHTML`), and re-run.
StarterKit 3's Link writes `target="_blank" rel="noopener noreferrer nofollow"` unless the app configured it otherwise.

### Plain ProseMirror JSON (prosemirror-model)

Use the app's own schema: `Node.fromJSON(schema, json)`, then
`DOMSerializer.fromSchema(schema).serializeFragment(node.content)` into a container element and read its
`innerHTML`. Every node's `toDOM` in the schema defines the result; review custom nodes.

### Lexical JSON (lexical / @lexical/headless / @lexical/html 0.53.0)

```js
// Node.js with jsdom (as the @lexical/html README describes)
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DocumentFragment = dom.window.DocumentFragment;

const { createHeadlessEditor } = await import('@lexical/headless');
const { $generateHtmlFromNodes } = await import('@lexical/html');
// Register the same node classes the app uses (HeadingNode, ListNode, LinkNode, custom nodes, …).
const editor = createHeadlessEditor({ nodes: [/* … */], onError: (e) => { throw e; } });

function lexicalToHtml(serialized) {
  editor.setEditorState(editor.parseEditorState(serialized));
  return editor.getEditorState().read(() => $generateHtmlFromNodes(editor, null));
}
```

A missing node class fails with `parseEditorState: type "heading" + not found`. Lexical's HTML wraps text
in `<span style="white-space: pre-wrap;">` (and bold as `<b><strong …>`); strip those wrappers in the script
if the team wants clean HTML.

### Draft.js raw JSON (draft-js 0.11.7)

Draft.js has no built-in HTML export. Use a community library on top of `convertFromRaw`:

```js
import { convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html'; // community package, 1.4.1
const html = stateToHTML(convertFromRaw(raw), { /* entityStyleFn / blockRenderers for custom entities */ });
```

`draftjs-to-html` (used with react-draft-wysiwyg) works on the raw JSON directly. Map custom entities
(mentions, embeds) yourself.

### Slate, Editor.js

- **Slate** has no standard document schema; use the app's own serializer (Slate's docs show writing a `serialize` function per node type).
- **Editor.js** blocks: `editorjs-html` (community) or a small renderer per block type. Decide with the user what blocks without an HTML meaning (polls, custom widgets) become.

### Real-time documents (Yjs)

Content stored only as Yjs updates (Tiptap Collaboration, Lexical/ProseMirror with Yjs) must be loaded into
the source editor (or converted with its Yjs binding) and exported as HTML first. Froala's `collaborative`
plugin keeps its own state; the old Yjs data is not reused.
<!-- validate:end -->

## What Froala changes when it loads HTML

`html.set()` and editor start-up clean the HTML. Knowing this avoids false alarms in the diff and lost content:

- **Allowed tags and attributes.** Tags not in `htmlAllowedTags` and attributes not in `htmlAllowedAttrs` are not kept. The defaults cover standard HTML (including `figure`, `details`/`summary`, `iframe`, `video`, `data-*`, `class`, `style`) but not editor-specific elements such as CKEditor's `<oembed>` or Rails' `<action-text-attachment>`. Convert those before loading, or extend the lists deliberately.
- **Removed tags.** `htmlRemoveTags` (default `script`, `style`) are removed with their content.
- **Images.** With the defaults (`useClasses: true`, `htmlUntouched: false`), every `<img>` without `fr-dib` / `fr-dii` gets Froala's alignment classes (`fr-fil`, `fr-fir`, `fr-dib`, `fr-dii`), worked out from its current float and display, and the inline `float`, `margin` and `display` styles are removed. Alignment that came from another editor's **CSS classes** (for example CKEditor's `image-style-align-left`) is only detected if that CSS is loaded in the editor, so convert those classes in the script.
- **`htmlUntouched: true`** keeps the markup as it is. It also turns off this cleanup, so test editing (lists, tables, images) before choosing it.

Extend the defaults instead of replacing them:

```js
new FroalaEditor('#editor', {
  htmlAllowedTags: FroalaEditor.DEFAULTS.htmlAllowedTags.concat(['my-widget']),
  htmlAllowedAttrs: FroalaEditor.DEFAULTS.htmlAllowedAttrs.concat(['data-sgid']),
});
```

`htmlAllowedTags` is an editor setting, **not** a security boundary. Keep (or add) server-side sanitizing
of saved HTML, and add Froala's classes (`fr-*`) and attributes to that sanitizer's allowlist, otherwise image
alignment and table styles disappear on save.

## Images and other files inside content

- **Data URIs** (`src="data:image/…"`): common with Quill and Summernote (Summernote inserts images as data URLs unless the app set its image-upload callback). Upload them to the project's storage in the script and replace the `src`; large documents and databases shrink a lot.
- **Signed or expiring URLs** (S3 pre-signed, Rails blob URLs): find out how the old app refreshed them; store a stable URL or the asset ID, not a URL that expires.
- **Relative URLs** and hosts: check that display pages, emails and mobile apps resolve them the same way.
- After migration, uploads go through Froala (`imageUploadURL`, `{ "link": … }` response); saved HTML must not contain `blob:` URLs.

## Verifying a conversion

Do this for every document in the sample, and for a random sample of the full set:

1. **Round trip:** source → HTML → `html.set()` in a Froala instance → `html.get()`. Normalize whitespace and compare with the converted HTML; explain every difference (most come from the rules above).
2. **Counts:** text length (without markup), images, links, tables, list items, headings, embeds. Any decrease is a defect until explained.
3. **Visual:** screenshot the old display page and the new one (with `froala_style.min.css` and an `fr-view` container) and compare.
4. **Display channels:** emails, PDFs, mobile apps or search indexing that use the stored HTML.

```js
// Browser helper for steps 1–2, on an editor created only for the check
const checker = new FroalaEditor('#migration-check', {
  events: {
    initialized() {
      window.roundTrip = (html) => {
        this.html.set(html);
        return this.html.get();
      };
    },
  },
});
```

Keep the source data and the converted copy until the user confirms the new editor in production.
