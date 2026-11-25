// Unrelated code: no Froala here, so none of it is checked.
const options = { heigth: 3, colors: ['red'], licenseKey: 'GPL' };
export function range(editor) {
  return editor.selection.getRange(options);
}
