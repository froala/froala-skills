import FroalaEditorComponent from 'react-froala-wysiwyg';
import { FroalaEditor } from 'froala-editor';
import 'froala-editor/js/plugins/image.min.js';

FroalaEditor.RegisterComand('x', {});
FroalaEditor.DefineIcon('star', { template: 'svg', SVG: '<svg></svg>' });
FroalaEditor.RegisterCommand('shout', {
  title: 'Shout',
  callback: () => {
    this.html.insert('!');
  },
});

const config = {
  licenseKey: 'abc',
  heigth: 300,
  imageUploadUrl: '/upload',
  toolbarButtons: ['bold', 'insertImage', 'insertTable', 'boldd', 'codeView', 'shout'],
  pluginsEnabled: ['image', 'image_manager'],
  events: {
    contentChange() {},
    'froalaEditor.focus'(e, editor) {},
    initialized: () => {
      this.html.get();
    },
  },
};

export function save(editor) {
  editor.events.on('contentChnged', () => {});
  editor.events.off('contentChanged');
  editor.text.get();
  return editor.html.getMarkdown();
}

export default function BadEditor() {
  $('#legacy').froalaEditor({});
  return <FroalaEditorComponent config={config} />;
}
