#!/usr/bin/env bash
# Stages a small project with froala-editor 5.6.0 installed in node_modules (runs only with --scaffold).
set -euo pipefail
mkdir -p src node_modules
cat > package.json <<'JSON'
{ "name": "froala-app", "private": true, "dependencies": { "froala-editor": "5.6.0" } }
JSON
cat > src/editor.js <<'JS'
import FroalaEditor from 'froala-editor';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins/link.min.js';

new FroalaEditor('#editor', {
  licenseKey: 'MY-REAL-KEY',
  toolbarStickyOfset: 60,
  toolbarButtons: ['bold', 'italic', 'insertLink']
});
JS
tmp=$(mktemp -d)
tgz=$(npm pack froala-editor@5.6.0 --pack-destination "$tmp" --loglevel error | tail -n 1)
tar -xzf "$tmp/$tgz" -C "$tmp"
mv "$tmp/package" node_modules/froala-editor
rm -rf "$tmp"
