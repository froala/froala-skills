# Tiptap / ProseMirror → Froala

Identifiers checked against `@tiptap/*` 3.34.0. Froala names checked against `froala-editor` 5.6.0.
Official Froala guides (Tiptap, ProseMirror): https://froala.com/wysiwyg-editor/docs/migration-guides/

<!-- validate:skip -->
## First: what does the app store?

- **HTML** (`editor.getHTML()`) → loads with `html.set()`.
- **JSON** (`editor.getJSON()`) → convert with `generateHTML(json, extensions)` from `@tiptap/html`, using the **same extensions** the app uses (otherwise nodes are dropped). Run it in a migration script on copies.
- **Plain ProseMirror** with a custom schema → serialize with the schema's own `DOMSerializer`; there is no generic converter.
- **Real-time documents stored as Yjs updates** (Tiptap Collaboration) → export each document to HTML from a Tiptap instance first. Froala's collaborative plugin keeps its own state; do not try to reuse the Yjs data.
<!-- validate:end -->

## Extensions

| Tiptap extension | Froala | Notes |
|---|---|---|
| StarterKit marks (Bold, Italic, Strike, Code) | `bold`, `italic`, `strikeThrough`, `inlineStyle` | Inline code: an `inlineStyles` entry or a custom command |
| Heading, Paragraph | `paragraphFormat` | |
| BulletList, OrderedList, ListItem | `formatUL`, `formatOL` | |
| Blockquote, CodeBlock, HorizontalRule | `quote`, `codeSnippet`, `insertHR` | |
| UndoRedo / History | `undo`, `redo` | |
| Underline, Subscript, Superscript | `underline`, `subscript`, `superscript` | |
| Link, Image, Youtube | `insertLink`, `insertImage`, `insertVideo` | |
| Table and its row/cell/header extensions | `insertTable` | |
| TextAlign | `align` | |
| TextStyle, Color, FontFamily, Highlight | `textColor`, `fontFamily`, `backgroundColor` | |
| Placeholder | `placeholderText` | |
| CharacterCount | `charCounterCount`, `charCounterMax` | |
| Collaboration, CollaborationCaret | `collaborative` | Froala 5.3+, different backend |
| Custom nodes and marks written by the project | Froala custom plugin (`froala-custom-plugins`), or keep their HTML with `htmlAllowedTags` / `htmlAllowedAttrs` | |

## Behaviour differences to plan for

<!-- validate:skip -->
- Tiptap is headless: the project built its own toolbar and menus. Two options, decide with the user:
  1. Use Froala's toolbar and map the project's buttons to `toolbarButtons`.
  2. Keep the project's UI with Froala's headless mode (`headless: true`, Froala 5.5.0+) and call Froala's API from the existing buttons. Limits: collaboration does not start in headless mode, and methods that open Froala's built-in popups or panels do nothing.
- Tiptap's `onUpdate` → Froala's `contentChanged` event; `editor.commands.setContent()` → `html.set()`.

<!-- validate:end -->