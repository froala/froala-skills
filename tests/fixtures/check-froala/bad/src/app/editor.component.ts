import { Component } from '@angular/core';
import { FroalaEditorModule } from 'angular-froala-wysiwyg';

@Component({ selector: 'app-editor', standalone: true, imports: [FroalaEditorModule], templateUrl: './editor.component.html' })
export class EditorComponent {
  public editorCfg: Object = {
    toolbarStickyOffset: 10,
    imageMaxSize: 1024,
    imageMaxSizeMB: 5,
  };
}
