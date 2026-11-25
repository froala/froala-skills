import { useMemo, useRef, useState } from 'react';
import FroalaEditorComponent from 'react-froala-wysiwyg';
import FroalaEditor from 'froala-editor';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins/image.min.js';
import 'froala-editor/js/plugins/link.min.js';
import 'froala-editor/js/plugins/lists.min.js';
import 'froala-editor/js/plugins/code_view.min.js';

FroalaEditor.DefineIcon('clearAll', { template: 'svg', PATH: 'M0 0h24v24H0z', VIEWBOX: '0 0 24 24' });
FroalaEditor.RegisterCommand('clearAll', {
  title: 'Clear',
  focus: false,
  undo: true,
  callback() {
    this.html.set('');
    this.undo.saveStep();
  },
});
FroalaEditor.RegisterCommand('templates', {
  title: 'Templates',
  type: 'dropdown',
  options: { header: 'Header', footer: 'Footer' },
  callback(cmd, val) {
    this.html.insert(val);
  },
});

export default function Editor() {
  const [model, setModel] = useState('');
  const ref = useRef(null);
  const config = useMemo(() => ({
    key: import.meta.env.VITE_FROALA_KEY,
    heightMin: 200,
    placeholderText: 'Write here',
    toolbarButtons: {
      moreText: { buttons: ['bold', 'italic', 'underline'] },
      moreRich: { buttons: ['insertLink', 'insertImage', 'clearAll', 'templates'] },
      moreMisc: { buttons: ['undo', 'redo', 'html'], align: 'right' },
    },
    pluginsEnabled: ['image', 'link', 'lists', 'codeView'],
    imageUploadURL: '/api/upload',
    events: {
      initialized() {
        this.events.on('keydown', () => true);
      },
      contentChanged() {
        setModel(this.html.get());
      },
      'image.error'(error) {
        console.error(error.code);
      },
    },
  }), []);
  const save = () => ref.current.editor.html.get();
  return <FroalaEditorComponent ref={ref} tag="textarea" model={model} onModelChange={setModel} config={config} onClick={save} />;
}
