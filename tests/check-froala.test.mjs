#!/usr/bin/env node
// Tests for scripts/check-froala.mjs, the read-only project checker that agents run. Each fixture under
// tests/fixtures/check-froala is a small project; at test time it is copied to a temp folder and given a
// node_modules/froala-editor (the real published package, from the validator's download cache) so the checker
// sees a real installed version. Dependency-free: node:test + node:assert.
//
//   node tests/check-froala.test.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(ROOT, 'tests', 'fixtures', 'check-froala');
const CHECKER = path.join(ROOT, 'scripts', 'check-froala.mjs');
const VERSION = '5.6.0';

// Same cache layout as scripts/validate-skills.mjs, so a validator run and the tests share one download.
function fetchPackage(name, version) {
  const dir = path.join(os.tmpdir(), `froala-validate-${version}`, name.replace('/', '__'));
  if (fs.existsSync(path.join(dir, '.extracted-ok')) && fs.existsSync(path.join(dir, 'package', 'package.json'))) return path.join(dir, 'package');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' }).trim();
  const tgz = sh('npm', ['pack', `${name}@${version}`, '--pack-destination', dir, '--loglevel', 'error']).split('\n').pop().trim();
  sh('tar', ['-xzf', path.join(dir, tgz), '-C', dir]);
  fs.writeFileSync(path.join(dir, '.extracted-ok'), new Date().toISOString());
  return path.join(dir, 'package');
}
const froalaPkg = fetchPackage('froala-editor', VERSION);
const reactPkg = fetchPackage('react-froala-wysiwyg', VERSION);

const temps = [];
process.on('exit', () => temps.forEach((t) => fs.rmSync(t, { recursive: true, force: true })));
// Copy a fixture to a temp project; install: { 'froala-editor': dir, 'react-froala-wysiwyg': dir, ... } as links.
function project(fixture, install = { 'froala-editor': froalaPkg, 'react-froala-wysiwyg': reactPkg }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-froala-'));
  temps.push(dir);
  fs.cpSync(path.join(FIX, fixture), dir, { recursive: true });
  for (const [name, src] of Object.entries(install)) {
    const target = path.join(dir, 'node_modules', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.symlinkSync(src, target, 'dir');
  }
  return dir;
}
function run(args, cwd = ROOT) {
  const r = spawnSync(process.execPath, [CHECKER, ...args], { encoding: 'utf8', cwd });
  return { status: r.status, out: r.stdout + r.stderr };
}
function json(args, cwd) {
  const r = run([...args, '--json'], cwd);
  return { status: r.status, result: JSON.parse(r.out) };
}
const brief = (f) => `${f.severity === 'error' ? 'E' : 'W'} ${f.file}:${f.line} ${f.rule} ${f.message}`;

test('good project: no findings, exit 0', () => {
  const dir = project('good');
  const { status, result } = json([dir]);
  assert.deepEqual(result.findings.map(brief), []);
  assert.equal(status, 0);
  assert.equal(result.froala.version, VERSION);
  assert.deepEqual(result.wrappers.map((w) => `${w.name} ${w.version} ${w.froalaEditorRange}`), [`react-froala-wysiwyg ${VERSION} ${VERSION}`]);
  assert.equal(result.filesScanned, 6);
});

test('bad project: every mistake is reported exactly once, with a fix', () => {
  const dir = project('bad');
  const { status, result } = json([dir]);
  const V = VERSION;
  assert.deepEqual(result.findings.map(brief), [
    `W package.json:0 unpinned-dependency package.json asks for froala-editor "latest", which moves to every new release (including major ones)`,
    `E index.html:4 cdn-unpinned Froala CDN link uses "latest", which moves to new releases (including major ones)`,
    `W index.html:4 missing-css Froala JavaScript is loaded, but no Froala stylesheet was found in the scanned files: the toolbar and popups will look broken`,
    `E index.html:5 cdn-unpinned Froala CDN link without a version: it serves whatever release is newest, so the editor changes (or breaks) without a deploy`,
    `E index.html:6 cdn-version Froala CDN link loads 5.5.0, but froala-editor ${V} is installed. Mixed versions break plugins and styles`,
    `E index.html:7 cdn-placeholder Froala CDN link still has the placeholder "VERSION" instead of a version`,
    `E index.html:8 cdn-unpinned Froala CDN link uses "5", which moves to new releases (including major ones)`,
    `E src/BadEditor.jsx:2 named-import froala-editor has a default export, not a named FroalaEditor export`,
    `E src/BadEditor.jsx:5 unknown-static "FroalaEditor.RegisterComand" does not exist in froala-editor ${V}`,
    `E src/BadEditor.jsx:6 defineicon-svg DefineIcon has no "SVG" key, so the icon renders empty`,
    `W src/BadEditor.jsx:9 arrow-this Command option "callback" is an arrow function but uses this.html: in an arrow function "this" is not the editor`,
    `E src/BadEditor.jsx:15 license-key "licenseKey" is not a Froala option, so the licence key is ignored`,
    `E src/BadEditor.jsx:16 unknown-option Option "heigth" does not exist in froala-editor ${V}`,
    `E src/BadEditor.jsx:17 unknown-option Option "imageUploadUrl" does not exist in froala-editor ${V}`,
    `E src/BadEditor.jsx:18 unknown-button Toolbar button "boldd" is not a command in froala-editor ${V} (and is not registered with FroalaEditor.RegisterCommand in this project), so it does not render`,
    `E src/BadEditor.jsx:18 unknown-button Toolbar button "codeView" is not a command in froala-editor ${V} (and is not registered with FroalaEditor.RegisterCommand in this project), so it does not render`,
    `E src/BadEditor.jsx:19 unknown-plugin "image_manager" is not a plugin name in froala-editor ${V}`,
    `E src/BadEditor.jsx:21 unknown-event Event "contentChange" does not exist in froala-editor ${V}`,
    `E src/BadEditor.jsx:22 v2-event "froalaEditor.focus" is a Froala 2 event name`,
    `W src/BadEditor.jsx:23 arrow-this Event handler "initialized" is an arrow function but uses this.html: in an arrow function "this" is not the editor`,
    `W src/BadEditor.jsx:30 unknown-event Event "contentChnged" does not exist in froala-editor ${V} (fine if your own code triggers it)`,
    `E src/BadEditor.jsx:31 unknown-method "events.off()" is not a method of the events module in froala-editor ${V}`,
    `W src/BadEditor.jsx:32 unknown-module "editor.text.get()": the editor has no "text" module or plugin in froala-editor ${V}`,
    `E src/BadEditor.jsx:33 unknown-method "html.getMarkdown()" is not a method of the html module in froala-editor ${V}`,
    `E src/BadEditor.jsx:37 jquery-api jQuery plugin call ".froalaEditor(...)" is the Froala 2 API; it does not exist since Froala 3`,
    `E src/Inline.vue:2 unknown-option Option "colorsDefaultTab" does not exist in froala-editor ${V}`,
    `E src/app/editor.component.ts:9 unknown-option Option "imageMaxSizeMB" does not exist in froala-editor ${V}`,
  ]);
  assert.equal(status, 1);
  assert.equal(result.errors, 21);
  const fixes = Object.fromEntries(result.findings.map((f) => [`${f.file}:${f.line}:${f.rule}`, f.fix]));
  assert.equal(fixes['src/BadEditor.jsx:16:unknown-option'], 'did you mean "height"?');
  assert.equal(fixes['src/BadEditor.jsx:17:unknown-option'], 'did you mean "imageUploadURL"?');
  assert.equal(fixes['src/BadEditor.jsx:5:unknown-static'], 'did you mean "FroalaEditor.RegisterCommand"?');
  assert.equal(fixes['src/BadEditor.jsx:19:unknown-plugin'], 'did you mean "imageManager"? (plugin names are camelCase: file image_manager.min.js is plugin "imageManager")');
  assert.equal(fixes['src/BadEditor.jsx:21:unknown-event'], 'did you mean "contentChanged"?');
  assert.equal(fixes['src/BadEditor.jsx:33:unknown-method'], '"getMarkdown" is a method of the markdown module: editor.markdown.getMarkdown()');
  assert.match(fixes['src/BadEditor.jsx:31:unknown-method'], /^methods of events: .*\bon\b.*\btrigger\b/);
  assert.match(fixes['src/BadEditor.jsx:15:license-key'], /key: 'YOUR-ACTIVATION-KEY'/);
  assert.equal(fixes['index.html:6:cdn-version'], `use ${V} in every Froala URL (or load the files from node_modules)`);
});

test('buttons whose plugin file is never loaded (index.html loads the pkgd bundle, so scan the component alone)', () => {
  const dir = project('bad');
  const { result } = json([dir, 'src/BadEditor.jsx']);
  const w = result.findings.filter((f) => f.rule === 'plugin-not-loaded' || f.rule === 'missing-css').map(brief);
  assert.deepEqual(w, [
    'W src/BadEditor.jsx:1 missing-css Froala JavaScript is loaded, but no Froala stylesheet was found in the scanned files: the toolbar and popups will look broken',
    'W src/BadEditor.jsx:18 plugin-not-loaded Toolbar button "insertTable" comes from js/plugins/table.min.js, which this project does not appear to load, so the button will not render',
  ]);
  assert.equal(result.findings.find((f) => f.rule === 'plugin-not-loaded').fix, "import 'froala-editor/js/plugins/table.min.js' (or 'froala-editor/js/plugins.pkgd.min.js' for all bundled plugins)");
});

test('a template-bound Angular config is checked through the variable in the component', () => {
  const dir = project('bad');
  const { result } = json([dir, 'src/app']);
  assert.deepEqual(result.findings.filter((f) => f.severity === 'error').map(brief), [`E src/app/editor.component.ts:9 unknown-option Option "imageMaxSizeMB" does not exist in froala-editor ${VERSION}`]);
});

test('wrapper pinned to another froala-editor version, and a second nested copy', () => {
  const fake = fs.mkdtempSync(path.join(os.tmpdir(), 'check-froala-wrapper-'));
  temps.push(fake);
  fs.writeFileSync(path.join(fake, 'package.json'), JSON.stringify({ name: 'react-froala-wysiwyg', version: '5.5.0', main: 'index.js', dependencies: { 'froala-editor': '5.5.0' } }));
  fs.writeFileSync(path.join(fake, 'index.js'), "module.exports = require('froala-editor');\n");
  fs.mkdirSync(path.join(fake, 'node_modules', 'froala-editor'), { recursive: true });
  fs.writeFileSync(path.join(fake, 'node_modules', 'froala-editor', 'package.json'), JSON.stringify({ name: 'froala-editor', version: '5.5.0' }));
  const dir = project('good', { 'froala-editor': froalaPkg, 'react-froala-wysiwyg': fake });
  const { status, result } = json([dir]);
  assert.equal(status, 1);
  assert.deepEqual(result.findings.map(brief), [
    `E package.json:0 wrapper-version react-froala-wysiwyg 5.5.0 depends on froala-editor "5.5.0", but froala-editor ${VERSION} is installed`,
    `E package.json:0 duplicate-froala Two copies of froala-editor are installed: ${VERSION} at the top level and 5.5.0 inside react-froala-wysiwyg. The wrapper uses its own copy, so plugins and languages you import register on the other one`,
  ]);
  assert.equal(result.findings[0].fix, 'npm i froala-editor@5.5.0 (the version the wrapper pins)');
});

test('froala-editor not installed: exit 2 with the install command', () => {
  const dir = project('good', {});
  const r = run([dir]);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /froala-editor is not installed/);
  assert.match(r.out, /npm i froala-editor@5\.6\.0/);
  const j = json([dir]);
  assert.equal(j.status, 2);
  assert.match(j.result.fatal, /npm i froala-editor@5\.6\.0/);
});

test('file arguments: scan only the given files, from the project folder as cwd', () => {
  const dir = project('bad');
  const r = run(['src/Inline.vue'], dir);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /1 file\(s\) scanned/);
  assert.match(r.out, /ERROR {3}src\/Inline\.vue:2 {2}Option "colorsDefaultTab" does not exist/);
  assert.match(r.out, /\n1 error\(s\), 1 warning\(s\)\n?$/); // + the package.json "latest" warning
});

test('the checker is read-only: no files change in the project', () => {
  const dir = project('bad');
  const snap = () => {
    const out = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isSymbolicLink()) out.push(`${p} -> ${fs.readlinkSync(p)}`);
        else if (e.isDirectory()) walk(p);
        else { const st = fs.statSync(p); out.push(`${p} ${st.size} ${st.mtimeMs}`); }
      }
    };
    walk(dir);
    return out.sort();
  };
  const before = snap();
  run([dir]);
  run([dir, '--json']);
  assert.deepEqual(snap(), before);
});

test('the checker source stays audit-friendly: no network, process, write or eval APIs', () => {
  const src = fs.readFileSync(CHECKER, 'utf8');
  for (const banned of [/node:child_process|['"]child_process['"]/, /node:https?|['"]https?['"]/, /node:net\b/, /\bfetch\(/, /\bwriteFile|appendFile|createWriteStream|mkdirSync|rmSync|unlinkSync|renameSync|copyFileSync|cpSync/, /\beval\(|new Function\(/, /\bvm\b.*from/]) {
    assert.ok(!banned.test(src), `scripts/check-froala.mjs must not use ${banned}`);
  }
});

test('generated copies in the skills match the source', () => {
  const src = fs.readFileSync(CHECKER, 'utf8');
  for (const skill of ['froala-initialization-and-sdks', 'froala-error-diagnosis', 'froala-upgrade']) {
    const copy = fs.readFileSync(path.join(ROOT, 'skills', skill, 'scripts', 'check-froala.mjs'), 'utf8');
    const lines = copy.split('\n');
    assert.match(lines[1], /^\/\/ GENERATED by scripts\/validate-skills\.mjs/);
    assert.equal([lines[0], ...lines.slice(2)].join('\n'), src, `${skill}/scripts/check-froala.mjs is stale; run node scripts/validate-skills.mjs --write`);
  }
});

test('--help and unknown options', () => {
  const h = run(['--help']);
  assert.equal(h.status, 0);
  assert.match(h.out, /Usage: node check-froala\.mjs/);
  const u = run(['--nope']);
  assert.equal(u.status, 2);
  assert.match(u.out, /Unknown option --nope/);
});
