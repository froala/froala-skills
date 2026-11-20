# Bugs fixed by upgrading to 5.6.0

Part of the froala-error-diagnosis skill (verified against froala-editor 5.6.0). Start from the symptom index in that skill's SKILL.md. In CDN URLs, replace `VERSION` with the installed version.

If the project uses 5.5.0 or older and the symptom is listed here, upgrade `froala-editor` and the framework wrapper together (from Froala's 5.6.0 release notes):

| Symptom on 5.5.0 or older | Area |
|---|---|
| Vite 8 React app shows a blank page or "Element type is invalid" | React (see `frameworks.md`) |
| StrictMode runs `initialized` three times; `onModelChange` fires when the editor loads | React |
| `ref.current.initialize()` / `ref.current.destroy()` throw | React |
| Passing the editor's own value back into `model` clears the undo history | React |
| After `FormControl.reset()`, the first edit does not update the form value | Angular Reactive Forms |
| Image, link and table popups open behind Angular Material v21 dialogs | Angular |
| Clear Formatting removes comments from the selected text | Collaboration |
| Formatting newly typed text loses its tracked insertion; Undo in Suggestion mode clears content | Track Changes |
| Potential XSS in Word export | Word Export (security) |
| Custom font size applies only in the first editor on the page | Several editors on one page |
