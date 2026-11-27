# Tiptap / ProseMirror → Froala

Identifiers checked against `@tiptap/*` 3.34.0 (`@tiptap/starter-kit`, `@tiptap/html`, `@tiptap/react`).
Froala names checked against `froala-editor` 5.6.0.
Official Froala guides: https://froala.com/wysiwyg-editor/docs/migration-guides/migrate-tiptap-to-froala/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate and
https://froala.com/wysiwyg-editor/docs/migration-guides/prosemirror-to-froala/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate

<!-- validate:skip -->
## First: what does the app store?

- **HTML** (`editor.getHTML()`) → loads with `html.set()`.
- **JSON** (`editor.getJSON()`) → convert with `generateHTML(json, extensions)` from `@tiptap/html` (browser) or `@tiptap/html/server` (Node.js, needs `happy-dom`), using the **same extensions** the app uses. A missing extension makes `generateHTML` throw `Unknown node type: …`; collect those documents and add the extension. Recipe in `content-conversion.md`.
- **Plain ProseMirror** with a custom schema → serialize with the schema's own `DOMSerializer`; there is no generic converter.
- **Real-time documents stored as Yjs updates** (Tiptap Collaboration) → export each document to HTML from a Tiptap instance first. Froala's collaborative plugin keeps its own state; do not try to reuse the Yjs data.
<!-- validate:end -->

## Extensions

StarterKit 3 includes Bold, Italic, Strike, Code, Underline, Link, Heading, Paragraph, Blockquote,
CodeBlock, HorizontalRule, HardBreak, BulletList, OrderedList, ListItem, ListKeymap, UndoRedo (via
`@tiptap/extensions`), Dropcursor, Gapcursor and TrailingNode. Check which ones the app disabled.

| Tiptap extension | Froala | Notes |
|---|---|---|
| StarterKit marks (Bold, Italic, Strike, Code, Underline) | `bold`, `italic`, `strikeThrough`, `inlineStyle`, `underline` | Inline code: an `inlineStyles` entry or a custom command |
| Heading, Paragraph | `paragraphFormat` | |
| BulletList, OrderedList, ListItem | `formatUL`, `formatOL` | |
| TaskList, TaskItem | No built-in equivalent | Stored task lists load as lists with checkboxes; toggling needs a custom plugin |
| Blockquote, CodeBlock / CodeBlockLowlight, HorizontalRule | `quote`, `codeSnippet`, `insertHR` | |
| UndoRedo (History in Tiptap 2) | `undo`, `redo` | |
| Subscript, Superscript | `subscript`, `superscript` | |
| Link, Image, Youtube | `insertLink`, `insertImage`, `insertVideo` | |
| Table and its row/cell/header extensions | `insertTable` | |
| TextAlign | `align` | |
| TextStyle / TextStyleKit: Color, BackgroundColor, FontFamily, FontSize, LineHeight; Highlight | `textColor`, `backgroundColor`, `fontFamily`, `fontSize`, `lineHeight` | |
| Placeholder | `placeholderText` | |
| CharacterCount | `charCounterCount`, `charCounterMax` | Word count: `wordCounter` |
| Typography (smart quotes while typing) | No built-in equivalent | Usually dropped, or a custom `keypress` handler |
| Mention | No built-in plugin | Froala's Tribute.js example (https://froala.com/wysiwyg-editor/examples/tribute-js/); keep the stored `data-*` attributes with `htmlAllowedAttrs` |
| BubbleMenu, FloatingMenu | `toolbarInline`, `quickInsert` | Inline toolbar on selection; quick-insert menu on empty lines |
| Collaboration, CollaborationCaret | `collaborative` | Froala 5.3+, different backend |
| Custom nodes and marks written by the project | Froala custom plugin ([Custom plugin](https://froala.com/wysiwyg-editor/docs/concepts/custom/plugin/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate)), or keep their HTML with `htmlAllowedTags` / `htmlAllowedAttrs` | |

## API and events

| Tiptap | Froala | Notes |
|---|---|---|
| `new Editor({ element, extensions, content })` / `useEditor(...)` | `new FroalaEditor(selector, options)` / `FroalaEditorComponent` | See `framework-wrappers.md` |
| `editor.getHTML()` | `html.get()` | |
| `editor.commands.setContent(html)` | `html.set()` | |
| `editor.commands.insertContent(html)` | `html.insert()` | |
| `onUpdate` / `editor.on('update')` | `contentChanged` event | |
| `onFocus` / `onBlur` | `focus` / `blur` events | |
| `editor.setEditable(false)` / `editable: false` | `edit.off()` / `edit.on()` | |
| `editor.destroy()` | `destroy()` | |
| `editor.getJSON()` | No equivalent | Froala's stored format is HTML |

## Behaviour differences to plan for

- Tiptap is headless: the project built its own toolbar and menus. Two options, decide with the user:
  1. Use Froala's toolbar and map the project's buttons to `toolbarButtons`.
  2. Keep the project's UI with Froala's headless mode (`headless: true`, Froala 5.5.0+) and call Froala's API from the existing buttons. Limits: collaboration does not start in headless mode, and methods that open Froala's built-in popups or panels do nothing.
- Tiptap's schema drops unknown markup on load; Froala keeps any tag in `htmlAllowedTags`. Content that was cleaned by the schema stays clean; HTML imported from other sources may keep more markup in Froala than before.
