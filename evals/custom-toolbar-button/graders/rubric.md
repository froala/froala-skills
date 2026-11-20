---
type: llm
---

PASS if the answer defines the icon with `FroalaEditor.DefineIcon` (for an SVG icon: `template: 'svg'` with `PATH`, optionally `VIEWBOX`), registers the command with `FroalaEditor.RegisterCommand` using a regular `function` callback that calls `this.html.insert(...)`, and adds the command name to `toolbarButtons` beside `'bold'`.
FAIL if it uses an arrow-function callback, an `SVG:` key, a jQuery API, or forgets to add the command to the toolbar.
