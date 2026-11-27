import FroalaEditor from 'froala-editor';
import FroalaEditorComponent from 'react-froala-wysiwyg';

export function setup() {
  const ed = new FroalaEditor('#aliased', {});
  const e2 = ed;
  ed.html.sett('<p>x</p>');
  e2.events.on('contentChangd', () => {});
  return ed;
}

export function fromRef(ref) {
  const inst = ref.current.getEditor();
  inst.selection.sav();
}

export default function Inline() {
  return <FroalaEditorComponent config={{ heigthF: 300, events: { contentChangd() {} } }} />;
}
