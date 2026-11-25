import { Component } from '@angular/core';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [FroalaEditorModule, FroalaViewModule],
  templateUrl: './editor.component.html',
})
export class EditorComponent {
  content = '';
  public options: Object = {
    key: 'YOUR-KEY',
    charCounterCount: true,
    toolbarSticky: false,
    events: {
      contentChanged: function () {
        console.log('changed');
      },
    },
  };
}
