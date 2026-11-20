# Froala with Angular

Part of the froala-initialization-and-sdks skill (verified against froala-editor 5.6.0). Install commands, CDN rules, the licence `key` and the default toolbar config are in that skill's SKILL.md.

**Before `ng new`, check Node.js.** The Angular CLI refuses to start on a Node.js version outside its range ("The Angular CLI requires a minimum Node.js version of …"). CLI 22 needs `^22.22.3`, `^24.15.0` or 26+; CLI 21 accepts `^20.19.0`, `^22.12.0` or 24+. Compare `node --version` with `npm view @angular/cli engines`. If the installed Node.js is too old for the latest CLI, ask the user whether to update Node.js, or use the newest CLI that supports it (for example `npx @angular/cli@21 new my-app`). Don't change the user's Node.js on your own. `angular-froala-wysiwyg` supports Angular 19+.

New Angular apps use **standalone components**, and from Angular 21 they run without zone.js; the Froala directives work in both. Import the Froala modules directly in the component. Do **not** put `FroalaEditorModule.forRoot()` in a standalone component's `imports`: Angular rejects `forRoot()` results there with error NG2012 ("Component imports contains a ModuleWithProviders value…").

```typescript
// editor.ts (editor.component.ts in projects generated before Angular 20)
import { Component } from '@angular/core';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import 'froala-editor/js/plugins.pkgd.min.js';

@Component({
  selector: 'app-editor',
  imports: [FroalaEditorModule, FroalaViewModule],
  template: `
    <div [froalaEditor]="options" [(froalaModel)]="content"></div>
    <div [froalaView]="content"></div>
  `,
})
export class EditorComponent {
  content = '<p>Hello from Angular!</p>';
  options = {
    key: 'TRIAL-LICENSE-KEY-FOR-FROALA-NOT-FOR-PRODUCTION-USE', // Froala's public trial key: set your licence key before production
    toolbarButtons: ['undo', 'redo', '|', 'paragraphFormat', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', '|', 'formatUL', 'formatOL'],
    paragraphFormat: { N: 'Normal text', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3' },
    paragraphFormatSelection: true,
    listAdvancedTypes: false,
    heightMin: 300,
  };
}
```

Older NgModule apps: `imports: [FroalaEditorModule.forRoot(), FroalaViewModule.forRoot()]` in the `@NgModule`.

**Show the editor inside `@defer`** in the parent template (import `EditorComponent` in the parent's `imports` as usual):

```html
<!-- app.html -->
@defer (on idle) {
  <app-editor />
} @placeholder {
  <p>Loading editor…</p>
}
```

`@defer` moves the editor, the wrapper and Froala (about 2 MB) into a lazy chunk. Without it, a new project fails `ng build` with "bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 1.67 MB", and an SSR project also fails with `ReferenceError: document is not defined` while extracting routes. With it, the initial bundle is about 0.5 MB, and on the server the placeholder is rendered and Froala is never loaded (checked on Angular 21 with Froala 5.6.0, with and without SSR).

In `angular.json`, add the stylesheets **after** the project's own stylesheet (`ng new` creates it as `src/styles.css`), and acknowledge that `froala-editor` is CommonJS:

```json
"styles": [
  "src/styles.css",
  "node_modules/froala-editor/css/froala_editor.pkgd.min.css",
  "node_modules/froala-editor/css/froala_style.min.css"
],
"allowedCommonJsDependencies": ["froala-editor"]
```

Both go in `projects.<name>.architect.build.options`. `allowedCommonJsDependencies` removes the "Module 'froala-editor' … is not ESM" warnings, including the one for `froala-editor/js/plugins.pkgd.min.js`.

Angular tips:

- **SSR (`@angular/ssr`)**: use the `@defer` block above. `angular-froala-wysiwyg` imports `froala-editor` as soon as it is loaded, so guarding only the plugins import is not enough: any static import of the editor component reaches the server and fails with `ReferenceError: document is not defined` (`Element is not defined` in some setups).
- **Budget warning**: with `@defer` the build passes, but Froala's global stylesheet (about 300 kB) can still exceed the 500 kB *warning* budget for the initial bundle. It is a warning, not an error; raise `maximumWarning` if the team wants a clean log.
- **"2 rules skipped due to selector errors: 0% -> Unmatched selector: %"** in production builds: harmless. It comes from two old vendor-prefixed keyframes in Froala's CSS (`@-moz-keyframes loading`, `@-o-keyframes loading`) that Angular's critical-CSS step does not recognise. The full stylesheet still loads.
- **Editor API**: listen to `(froalaInit)` for `{ initialize, destroy, getEditor }`. Binding it switches the directive to manual start, so call `initialize()` yourself. Its payload is typed `Object`, so take it as `any` (example in froala-methods-and-events).
- **NG0751 in `ng serve`**: with hot module replacement on, Angular logs that `@defer` dependencies load eagerly. Expected in development only.
- **Reactive Forms**: up to 5.5.0, after `FormControl.reset()` the first edit does not update the form value. 5.6.0 fixes this by saving an undo step whenever the form writes a value into the editor. That step fires `contentChanged`, so your own `contentChanged` handlers also run when the form writes a value. Don't treat that call as a user edit.
- **Angular Material dialogs**: up to 5.5.0, image, link and table popups open behind Angular Material v21 dialogs. Fixed in 5.6.0.
