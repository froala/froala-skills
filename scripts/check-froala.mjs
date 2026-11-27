#!/usr/bin/env node
// check-froala.mjs: checks a project's Froala editor code against the froala-editor package that is INSTALLED in
// the project, so every option, event, method, plugin and toolbar button name is checked against that exact version.
//
//   node check-froala.mjs [projectDir] [files or folders...] [--json]
//
//   projectDir   the folder with package.json (default: the current folder)
//   files        what to scan (default: src/ app/ pages/ components/ public/ and the files at the project root)
//   --json       print the result as JSON
//
// Exit codes: 0 = no errors (warnings may be printed), 1 = errors found, 2 = cannot run (for example
// froala-editor is not installed in node_modules).
//
// Safe to run on any project: read-only and offline. It reads package.json files, node_modules/froala-editor
// and the wrapper packages, and the project's source files. It makes no network requests, writes no files,
// starts no processes and never executes the project's code. Node 18+, no dependencies.
//
// The source of this file is scripts/check-froala.mjs in https://github.com/froala/froala-skills. The copies in
// skills/*/scripts/ are generated from it by `node scripts/validate-skills.mjs --write`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WRAPPERS = ['react-froala-wysiwyg', 'vue-froala-wysiwyg', 'angular-froala-wysiwyg', 'svelte-froala-wysiwyg'];

// ---------- minimal JS tokenizer (works on minified code, snippets, JSX and templates) ----------
const KW_BEFORE_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
export function tokenize(src) {
  const out = [];
  const n = src.length;
  let i = 0;
  const regexAllowed = () => {
    const p = out[out.length - 1];
    if (!p) return true;
    if (p.t === 'num' || p.t === 'str' || p.t === 'tpl' || p.t === 're') return false;
    if (p.t === 'id') return KW_BEFORE_REGEX.has(p.v);
    return !(p.v === ')' || p.v === ']' || p.v === '}');
  };
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\n' || c === '\t' || c === '\r') { i++; continue; }
    const s = i;
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === '"' || c === "'") {
      for (i++; i < n && src[i] !== c && src[i] !== '\n'; i++) if (src[i] === '\\') i++;
      i++;
      out.push({ t: 'str', v: src.slice(s + 1, i - 1), s, e: i });
      continue;
    }
    if (c === '`') {
      i++;
      let depth = 0;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (depth === 0 && src[i] === '`') { i++; break; }
        if (src[i] === '$' && src[i + 1] === '{') { depth++; i += 2; continue; }
        if (depth > 0 && src[i] === '}') { depth--; i++; continue; }
        if (depth > 0 && (src[i] === '"' || src[i] === "'")) { const q = src[i]; for (i++; i < n && src[i] !== q; i++) if (src[i] === '\\') i++; i++; continue; }
        i++;
      }
      out.push({ t: 'tpl', v: src.slice(s, i), s, e: i });
      continue;
    }
    if (c === '/' && regexAllowed()) {
      let inClass = false;
      for (i++; i < n; i++) {
        const d = src[i];
        if (d === '\\') { i++; continue; }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if ((d === '/' && !inClass) || d === '\n') break;
      }
      i++;
      while (i < n && /[a-z]/i.test(src[i])) i++;
      out.push({ t: 're', v: src.slice(s, i), s, e: i });
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) { while (i < n && /[\w$]/.test(src[i])) i++; out.push({ t: 'id', v: src.slice(s, i), s, e: i }); continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) { while (i < n && /[\w.]/.test(src[i])) i++; out.push({ t: 'num', v: src.slice(s, i), s, e: i }); continue; }
    if (c === '.' && src[i + 1] === '.' && src[i + 2] === '.') { i += 3; out.push({ t: 'p', v: '...', s, e: i }); continue; }
    if (c === '=' && src[i + 1] === '>') { i += 2; out.push({ t: 'p', v: '=>', s, e: i }); continue; }
    i++;
    out.push({ t: 'p', v: c, s, e: i });
  }
  return out;
}
export const isOpen = (tk) => !!tk && tk.t === 'p' && (tk.v === '{' || tk.v === '(' || tk.v === '[');
export const isClose = (tk) => !!tk && tk.t === 'p' && (tk.v === '}' || tk.v === ')' || tk.v === ']');
export function closeOf(T, k) {
  // index of the token closing the bracket at T[k]
  let d = 0;
  for (let m = k; m < T.length; m++) {
    if (isOpen(T[m])) d++;
    else if (isClose(T[m]) && --d === 0) return m;
  }
  return T.length - 1;
}
export function objectKeys(T, k) {
  // keys of the object literal whose "{" is T[k]: [{ key, s, i }] (s = source offset, i = token index)
  const end = closeOf(T, k);
  const keys = [];
  let expect = true;
  for (let q = k + 1; q < end; q++) {
    const tk = T[q];
    if (isOpen(tk)) { q = closeOf(T, q); expect = false; continue; }
    if (tk.t === 'p' && tk.v === ',') { expect = true; continue; }
    if (expect) {
      let j = q;
      if (tk.t === 'id' && ['async', 'get', 'set', 'static'].includes(tk.v) && T[q + 1] && (T[q + 1].t === 'id' || T[q + 1].t === 'str')) j = q + 1;
      const kt = T[j];
      const next = T[j + 1];
      if ((kt.t === 'id' || kt.t === 'str' || kt.t === 'num') && next && next.t === 'p' && (next.v === ':' || next.v === '(')) keys.push({ key: kt.v, s: kt.s, i: j });
      else if (kt.t === 'id' && next && next.t === 'p' && (next.v === ',' || next.v === '}')) keys.push({ key: kt.v, s: kt.s, i: j, shorthand: true });
      q = j;
    }
    expect = false;
  }
  return keys;
}
export function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return (index) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

// ---------- index of what really exists in a froala-editor package ----------
function readJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'languages', 'demo'].includes(entry.name)) continue;
      out.push(...readJsFiles(p));
    } else if (/\.(m?js|jsx|ts|svelte|vue)$/.test(entry.name) && !entry.name.endsWith('.map')) {
      out.push({ path: p, text: fs.readFileSync(p, 'utf8') });
    }
  }
  return out;
}
export function readJsSources(dir) {
  return readJsFiles(dir);
}
function returnedMethods(T, bodyOpen, bodyClose) {
  // Union of the methods of every object a module function returns at its top level.
  // "closed" is false when a returned value cannot be resolved to object literals (the module is then not pair-checked).
  const methods = new Set();
  let closed = true;
  let returns = 0;
  const assigned = new Map(); // variable -> object literal "{" token index (top level of the module body)
  const dynamic = new Set(); // variables with computed-property writes: x[k] = ...
  const extra = new Map(); // variable -> names assigned with x.name = ...
  for (let m = bodyOpen + 1; m < bodyClose; m++) {
    const tk = T[m];
    if (tk.t === 'id' && T[m + 1] && T[m + 1].v === '=' && T[m + 2] && T[m + 2].v === '{' && !(T[m - 1] && T[m - 1].v === '.')) assigned.set(tk.v, m + 2);
    if (tk.t === 'id' && T[m + 1] && T[m + 1].v === '[' && !(T[m - 1] && T[m - 1].v === '.')) {
      const c = closeOf(T, m + 1);
      if (T[c + 1] && T[c + 1].v === '=' && !(T[c + 2] && T[c + 2].v === '=')) dynamic.add(tk.v);
    }
    if (tk.t === 'id' && T[m + 1] && T[m + 1].v === '.' && T[m + 2] && T[m + 2].t === 'id' && T[m + 3] && T[m + 3].v === '=' && !(T[m + 4] && T[m + 4].v === '=') && !(T[m - 1] && T[m - 1].v === '.')) {
      if (!extra.has(tk.v)) extra.set(tk.v, new Set());
      extra.get(tk.v).add(T[m + 2].v);
    }
  }
  const resolveVar = (name, depth = 0) => {
    if (depth > 3) { closed = false; return; }
    if (!assigned.has(name) || dynamic.has(name)) { closed = false; return; }
    for (const { key } of objectKeys(T, assigned.get(name))) methods.add(key);
    for (const n of extra.get(name) || []) methods.add(n);
  };
  let depth = 0;
  for (let m = bodyOpen; m <= bodyClose; m++) {
    const tk = T[m];
    if (isOpen(tk)) { depth++; continue; }
    if (isClose(tk)) { depth--; continue; }
    if (depth !== 1 || tk.t !== 'id') continue;
    if (tk.v === 'function') {
      // skip a nested function declaration entirely
      let j = m + 1;
      while (j < bodyClose && T[j].v !== '{') j++;
      m = closeOf(T, j);
      continue;
    }
    if (tk.v !== 'return') continue;
    returns++;
    // the returned expression: up to ";" at its own depth or the end of the body
    let d = 0;
    let j = m + 1;
    let objects = 0;
    let vars = [];
    for (; j < bodyClose; j++) {
      const x = T[j];
      if (d === 0 && x.t === 'p' && x.v === ';') break;
      if (x.t === 'id' && x.v === 'function') {
        let b = j + 1;
        while (b < bodyClose && T[b].v !== '{') b++;
        j = closeOf(T, b);
        continue;
      }
      if (x.t === 'p' && x.v === '=>') {
        if (T[j + 1] && T[j + 1].v === '{') j = closeOf(T, j + 1);
        continue;
      }
      if (x.t === 'p' && x.v === '{') {
        const prev = T[j - 1];
        if (prev && (prev.v === 'return' || (prev.t === 'p' && ['(', ',', '?', ':', '=', '['].includes(prev.v)))) {
          for (const { key } of objectKeys(T, j)) methods.add(key);
          objects++;
        }
        j = closeOf(T, j);
        continue;
      }
      if (isOpen(x)) { d++; continue; }
      if (isClose(x)) { if (d === 0) break; d--; continue; }
      if (x.t === 'id' && !(T[j - 1] && T[j - 1].v === '.') && T[j + 1] && T[j + 1].t === 'p' && [',', ')', ';', '}', ']'].includes(T[j + 1].v)) vars.push(x.v);
      else if (x.t === 'id' && !(T[j - 1] && T[j - 1].v === '.') && j + 1 >= bodyClose) vars.push(x.v);
    }
    vars = vars.filter((v) => !['void', 'null', 'undefined', 'this', 'true', 'false'].includes(v));
    for (const v of vars) resolveVar(v);
    if (!objects && !vars.length) closed = false;
  }
  if (!returns) closed = false;
  return { methods, closed };
}

// Builds the name index of an extracted/installed froala-editor package folder (the one with package.json and js/).
export function buildFroalaIndex(froalaDir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(froalaDir, 'package.json'), 'utf8'));
  const jsDir = path.join(froalaDir, 'js');
  const froalaSource = readJsFiles(jsDir).map((f) => f.text).join('\n');
  const tokens = new Set(froalaSource.match(/[A-Za-z_$][\w$]*/g));
  // Exact quoted-string lookup. (A regex that pairs quotes across a minified file drifts and gives false results.)
  const stringCache = new Map();
  const strings = {
    has(name) {
      if (!stringCache.has(name)) {
        stringCache.set(name, froalaSource.includes(`"${name}"`) || froalaSource.includes(`'${name}'`) || froalaSource.includes(`\`${name}\``));
      }
      return stringCache.get(name);
    },
  };
  const commands = new Set();
  for (const m of froalaSource.matchAll(/RegisterCommand\(\s*["']([^"']+)["']/g)) commands.add(m[1]);
  for (const m of froalaSource.matchAll(/[{,]([A-Za-z_]\w*):\{title:"/g)) commands.add(m[1]);

  // Options (DEFAULTS keys) and module -> methods, from the files that define the editor (not the pkgd bundles).
  const coreFile = path.join(jsDir, 'froala_editor.min.js');
  const coreText = fs.readFileSync(coreFile, 'utf8');
  const definingFiles = [coreFile];
  for (const sub of ['plugins', 'third_party']) {
    const dir = path.join(jsDir, sub);
    if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.min.js')).sort()) definingFiles.push(path.join(dir, f));
  }
  const optionNames = new Set();
  const moduleIndex = new Map(); // name -> { methods: Set, closed: bool }
  for (const f of definingFiles) {
    const src = f === coreFile ? coreText : fs.readFileSync(f, 'utf8');
    const T = tokenize(src);
    for (let k = 0; k + 4 < T.length; k++) {
      const tk = T[k];
      if (tk.t !== 'id') continue;
      if (tk.v === 'DEFAULTS') {
        const a = T[k + 1];
        const b = T[k + 2];
        if (a && b && a.t === 'p' && (a.v === ':' || a.v === ',') && b.v === '{') for (const { key } of objectKeys(T, k + 2)) optionNames.add(key);
        if (a && a.v === '.' && b && b.t === 'id' && T[k + 3] && T[k + 3].v === '=' && !(T[k + 4] && T[k + 4].v === '=')) optionNames.add(b.v);
        continue;
      }
      if ((tk.v === 'MODULES' || tk.v === 'PLUGINS') && T[k + 1].v === '.' && T[k + 2].t === 'id' && T[k + 3].v === '=' && T[k + 4].v === 'function') {
        const name = T[k + 2].v;
        let j = k + 5;
        while (j < T.length && T[j].v !== '{') j++;
        const close = closeOf(T, j);
        const { methods, closed } = returnedMethods(T, j, close);
        const prev = moduleIndex.get(name);
        if (prev) { for (const m of methods) prev.methods.add(m); prev.closed = prev.closed && closed; } else moduleIndex.set(name, { methods, closed });
      }
    }
  }
  // Methods attached later from another file: <x>.<module>.<name> = function
  for (const m of froalaSource.matchAll(/[\w$]\.([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*=\s*function/g)) {
    if (moduleIndex.has(m[1])) moduleIndex.get(m[1]).methods.add(m[2]);
  }
  // Options read but never given a default (e.g. key, collabConfig): opts.x, and the compiled form of opts?.x
  for (const m of froalaSource.matchAll(/\bopts\.([A-Za-z_$][\w$]*)/g)) optionNames.add(m[1]);
  for (const m of froalaSource.matchAll(/opts\)\|\|null==\(([\w$]+)=\1\.([A-Za-z_$][\w$]*)\)/g)) optionNames.add(m[2]);
  const optionsReliable = optionNames.size > 200; // if the DEFAULTS scan breaks on a future build, fall back to token lookup
  const isOption = (name) => optionNames.has(name) || (!optionsReliable && (tokens.has(name) || strings.has(name)));
  // For "<module>.<name>": true/false when the module is indexed and closed, null when it cannot be decided.
  const modulePair = (mod, name) => {
    const entry = moduleIndex.get(mod);
    if (!entry || !entry.closed) return null;
    return entry.methods.has(name) || strings.has(`${mod}.${name}`);
  };

  // plugin file -> registered plugins and modules, commands, and presence in EACH bundle
  const readOr = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
  const bundleText = { pkgd: readOr(path.join(jsDir, 'froala_editor.pkgd.min.js')), pluginsPkgd: readOr(path.join(jsDir, 'plugins.pkgd.min.js')) };
  const pluginRegex = /PLUGINS\.([A-Za-z_]\w*)\s*=\s*function/g;
  const moduleRegex = /MODULES\.([A-Za-z_]\w*)\s*=\s*function/g;
  const coreModules = new Set([...coreText.matchAll(moduleRegex)].map((m) => m[1]));
  const coreCommands = new Set([...coreText.matchAll(/RegisterCommand\(\s*["']([^"']+)["']/g)].map((m) => m[1]));
  for (const m of coreText.matchAll(/[{,]([A-Za-z_]\w*):\{title:"/g)) coreCommands.add(m[1]);
  const registeredIn = (text, kind, name) => text.includes(`${kind}.${name}=function`) || new RegExp(`${kind}\\.${name}\\s*=\\s*function`).test(text);
  const allPluginNames = new Set();
  const pluginRows = [];
  for (const sub of ['plugins', 'third_party']) {
    const dir = path.join(jsDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.min.js')).sort()) {
      const text = fs.readFileSync(path.join(dir, file), 'utf8');
      const plugins = [...new Set([...text.matchAll(pluginRegex)].map((m) => m[1]))];
      const modules = [...new Set([...text.matchAll(moduleRegex)].map((m) => m[1]))].filter((n) => !coreModules.has(n));
      plugins.forEach((n) => allPluginNames.add(n));
      const cmds = [...new Set([...text.matchAll(/RegisterCommand\(\s*["']([^"']+)["']/g)].map((m) => m[1]))];
      const entries = [...plugins.map((n) => ['PLUGINS', n]), ...modules.map((n) => ['MODULES', n])];
      const inBundle = (t) => entries.length > 0 && entries.every(([kind, n]) => registeredIn(t, kind, n));
      pluginRows.push({ file: `js/${sub}/${file}`, plugins, modules, cmds, inPkgd: inBundle(bundleText.pkgd), inPluginsPkgd: inBundle(bundleText.pluginsPkgd) });
    }
  }
  // file and folder names (e.g. track_changes.min.js or js/third_party/)
  const fileNames = new Set(['plugins', 'third_party']);
  for (const r of pluginRows) fileNames.add(path.basename(r.file).replace(/\.min\.js$/, ''));

  return { version: pkg.version, froalaSource, tokens, strings, commands, coreCommands, optionNames, optionsReliable, isOption, moduleIndex, modulePair, coreModules, allPluginNames, pluginRows, fileNames };
}

// ---------- suggestions ----------
// Edit distance with adjacent transpositions (optimal string alignment): "heigth" -> "height" is 1.
export function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}
export function nearest(name, candidates) {
  if (name.length < 4) return null; // too short to guess from
  const lower = name.toLowerCase();
  let best = null;
  let bestD = Infinity;
  for (const c of candidates) {
    if (c === name || /^[_$]/.test(c)) continue;
    const cl = c.toLowerCase();
    if (cl === lower) return c; // only the case differs
    if (Math.abs(c.length - name.length) > 4) continue;
    const d = editDistance(lower, cl);
    if (d < bestD || (d === bestD && best && c < best)) { best = c; bestD = d; }
  }
  const limit = Math.max(1, Math.min(3, Math.floor(name.length / 4)));
  return bestD <= limit ? best : null;
}

// ---------- tiny semver (enough for package.json ranges) ----------
function parseVer(v) {
  const m = String(v).trim().replace(/^[v=]+/, '').match(/^(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([\w.-]+))?/);
  if (!m) return null;
  const n = (x) => (x === undefined || /[xX*]/.test(x) ? null : Number(x));
  return { major: Number(m[1]), minor: n(m[2]), patch: n(m[3]), pre: m[4] || null };
}
function cmp(a, b) {
  for (const k of ['major', 'minor', 'patch']) if ((a[k] || 0) !== (b[k] || 0)) return (a[k] || 0) < (b[k] || 0) ? -1 : 1;
  if (a.pre && !b.pre) return -1;
  if (!a.pre && b.pre) return 1;
  return 0;
}
// true / false, or null when the range cannot be understood (tags, URLs, workspace:...)
export function satisfies(version, range) {
  const v = parseVer(version);
  if (!v) return null;
  const r = String(range || '').trim();
  if (r === '' || r === '*' || r === 'x') return true;
  if (/^(latest|next|beta|workspace:|file:|link:|git|http|npm:|github:)/.test(r)) return null;
  return r.split('||').some((alt) => {
    const parts = alt.trim().replace(/\s+-\s+/, ' - ').split(/\s+/).filter(Boolean);
    if (parts.length === 3 && parts[1] === '-') {
      const lo = parseVer(parts[0]);
      const hi = parseVer(parts[2]);
      return lo && hi && cmp(v, lo) >= 0 && cmp(v, hi) <= 0;
    }
    return parts.every((p) => {
      const m = p.match(/^(\^|~|>=|<=|>|<|=)?(.*)$/);
      const op = m[1] || '';
      const t = parseVer(m[2]);
      if (!t) return false;
      const lo = { major: t.major, minor: t.minor || 0, patch: t.patch || 0, pre: t.pre };
      if (op === '>=') return cmp(v, lo) >= 0;
      if (op === '>') return cmp(v, lo) > 0;
      if (op === '<=') return cmp(v, lo) <= 0;
      if (op === '<') return cmp(v, lo) < 0;
      if (op === '^') {
        if (cmp(v, lo) < 0) return false;
        if (t.major > 0 || t.minor === null) return v.major === t.major;
        if (t.minor > 0 || t.patch === null) return v.major === 0 && v.minor === t.minor;
        return v.major === 0 && v.minor === 0 && v.patch === t.patch;
      }
      if (op === '~') return cmp(v, lo) >= 0 && v.major === t.major && (t.minor === null || v.minor === t.minor);
      // exact or x-range
      if (v.major !== t.major) return false;
      if (t.minor !== null && v.minor !== t.minor) return false;
      if (t.patch !== null && v.patch !== t.patch) return false;
      if (t.pre && v.pre !== t.pre) return false;
      return t.minor === null || t.patch === null || !v.pre || v.pre === t.pre;
    });
  });
}

// ---------- project discovery ----------
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.nuxt', '.output', '.svelte-kit', '.angular', 'coverage', '.git', 'vendor', 'bower_components', '.cache', '.turbo', '.vercel', 'tmp', '.parcel-cache']);
const SOURCE_EXT = /\.(js|jsx|ts|tsx|mjs|cjs|vue|svelte|html|htm)$/i;
const STYLE_EXT = /\.(css|scss|sass|less)$/i;
const DEFAULT_DIRS = ['src', 'app', 'pages', 'components', 'public'];
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FILES = 5000;
const readJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};
function findInstalled(projectDir, name) {
  // node_modules/<name>/package.json in the project or a parent folder (workspaces hoist packages)
  let dir = projectDir;
  for (;;) {
    const p = path.join(dir, 'node_modules', name, 'package.json');
    if (fs.existsSync(p)) {
      const pkg = readJson(p);
      if (pkg) return { dir: path.dirname(p), version: pkg.version, pkg };
    }
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}
function collectFiles(target, out, withStyles) {
  let st;
  try {
    st = fs.statSync(target);
  } catch {
    return;
  }
  if (out.size >= MAX_FILES) return;
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(target, { withFileTypes: true })) {
      if (e.isDirectory() && (SKIP_DIRS.has(e.name) || e.name.startsWith('.'))) continue;
      if (e.isSymbolicLink()) continue;
      collectFiles(path.join(target, e.name), out, withStyles);
    }
  } else if (st.isFile() && st.size <= MAX_FILE_BYTES && !/\.min\.(js|css)$/i.test(target) && (SOURCE_EXT.test(target) || (withStyles && STYLE_EXT.test(target)))) {
    out.add(path.resolve(target));
  }
}

// What a wrapper package loads by itself (the Vue wrapper imports the CSS and plugins.pkgd, for example).
function wrapperLoads(dir, pkg) {
  const seen = new Set();
  const queue = [pkg.module, pkg.main, 'index.js'].filter(Boolean).map((f) => path.resolve(dir, f));
  let text = '';
  while (queue.length && seen.size < 30) {
    const f = queue.shift();
    const file = [f, `${f}.js`, `${f}.mjs`, path.join(f, 'index.js')].find((x) => fs.existsSync(x) && fs.statSync(x).isFile());
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const t = fs.readFileSync(file, 'utf8');
    text += t;
    for (const m of t.matchAll(/(?:require\(|import\s*\(?|from\s*)\s*["'](\.{1,2}\/[^"']+)["']/g)) queue.push(path.resolve(path.dirname(file), m[1]));
  }
  return { css: /froala-editor\/css\//.test(text), pluginsPkgd: /froala-editor\/js\/plugins\.pkgd/.test(text) };
}

// ---------- checks ----------
const STRONG_CONFIG = /^(?:froala|editor|froalaEditor)(?:Config|Options|Opts|Settings)$|(?:Froala|Editor)(?:Config|Options)$/;
const GENERIC_CONFIG = /^(?:config|options|opts|settings|cfg)$/;
const EDITOR_RECEIVER = /^(?:editor|\w*Editor|froala\w*|\w*Froala\w*|getEditor\(\))$/;
const FROALA_RECEIVER = /^(?:editor|froala\w*|\w*Froala\w*|getEditor\(\))$/; // errors only on these; other *Editor names warn
// Module names that are also everyday words: this.<word>.x() is not checked
const GENERIC_MODULE_WORDS = new Set(['data', 'node', 'size', 'core', 'keys', 'position', 'refresh', 'format', 'language', 'icon', 'file', 'url', 'save', 'print', 'help', 'spaces', 'markers', 'clean', 'helpers', 'tooltip', 'toast', 'modals', 'snapshot', 'entities', 'forms', 'quote', 'lists', 'align', 'colors', 'video', 'link', 'table', 'image', 'model', 'cursor', 'button', 'edit', 'placeholder', 'toolbar', 'accessibility', 'shortcuts', 'fullscreen']);
const NOT_MODULES = new Set(['$el', '$tb', '$box', '$wp', '$oel', '$sc', '$doc', '$win', 'opts', 'el', 'o_doc', 'o_win', 'doc', 'win', 'shared', 'id', 'sid', 'props', 'state', 'current', 'value', 'config', 'options']);
const CDN_PATTERNS = [
  /\bcdn\.jsdelivr\.net\/npm\/froala-editor(?:@([^/'"\s)<>]*))?(?=[/'"\s)<>]|$)/g,
  /\bunpkg\.com\/froala-editor(?:@([^/'"\s)<>]*))?(?=[/'"\s)<>]|$)/g,
  /\bcdnjs\.cloudflare\.com\/ajax\/libs\/froala-editor(?:\/([^/'"\s)<>]*))?(?=[/'"\s)<>]|$)/g,
];

export function checkProject({ projectDir, targets = [], cwd = process.cwd() }) {
  const result = { project: projectDir, froala: null, wrappers: [], filesScanned: 0, findings: [], errors: 0, warnings: 0, fatal: null };
  const seenFindings = new Set();
  const add = (severity, file, line, rule, message, fix) => {
    const f = file ? path.relative(projectDir, file) || path.basename(file) : 'package.json';
    const key = `${severity}|${f}|${line}|${message}`;
    if (seenFindings.has(key)) return;
    seenFindings.add(key);
    result.findings.push({ severity, file: f, line: line || 0, rule, message, ...(fix ? { fix } : {}) });
  };

  const pkgPath = path.join(projectDir, 'package.json');
  const pkg = readJson(pkgPath) || {};
  const allDeps = { ...(pkg.peerDependencies || {}), ...(pkg.optionalDependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.dependencies || {}) };

  // ----- which files to scan
  const files = new Set();
  if (targets.length) {
    for (const t of targets) {
      const abs = [path.resolve(cwd, t), path.resolve(projectDir, t)].find((p) => fs.existsSync(p));
      if (!abs) { add('warning', null, 0, 'missing-target', `"${t}" does not exist; it was not scanned`); continue; }
      collectFiles(abs, files, true);
    }
  } else {
    for (const d of DEFAULT_DIRS) collectFiles(path.join(projectDir, d), files, true);
    for (const e of fs.readdirSync(projectDir, { withFileTypes: true })) {
      if (e.isFile() && (SOURCE_EXT.test(e.name) || STYLE_EXT.test(e.name)) && !/\.min\./.test(e.name)) collectFiles(path.join(projectDir, e.name), files, true);
    }
  }
  // config files that load scripts and styles (Angular CLI, Nx), read for the CSS / plugin heuristics only
  const loaderTexts = [];
  for (const f of ['angular.json', 'project.json', 'nuxt.config.ts', 'nuxt.config.js']) {
    const p = path.join(projectDir, f);
    if (fs.existsSync(p) && fs.statSync(p).size <= MAX_FILE_BYTES) loaderTexts.push(fs.readFileSync(p, 'utf8'));
  }
  const texts = new Map();
  for (const f of [...files].sort()) {
    try {
      texts.set(f, fs.readFileSync(f, 'utf8'));
    } catch {
      /* unreadable: skip */
    }
  }
  result.filesScanned = texts.size;

  // ----- installed packages
  const installed = findInstalled(projectDir, 'froala-editor');
  const wanted = (() => {
    const spec = allDeps['froala-editor'];
    if (spec && /^\D*(\d+\.\d+\.\d+)/.test(spec)) return spec.match(/(\d+\.\d+\.\d+)/)[1];
    for (const w of WRAPPERS) {
      const wi = findInstalled(projectDir, w);
      const pin = wi && ((wi.pkg.dependencies || {})['froala-editor'] || (wi.pkg.peerDependencies || {})['froala-editor']);
      if (pin && /(\d+\.\d+\.\d+)/.test(pin)) return pin.match(/(\d+\.\d+\.\d+)/)[1];
    }
    for (const t of texts.values()) {
      for (const re of CDN_PATTERNS) {
        re.lastIndex = 0;
        for (const m of t.matchAll(re)) if (m[1] && /^\d+\.\d+\.\d+$/.test(m[1])) return m[1];
      }
    }
    return null;
  })();
  if (!installed) {
    result.fatal = `froala-editor is not installed in ${path.join(projectDir, 'node_modules')} (or a parent folder), so there is no package to check against. Install the version the project uses, then run this again: npm i froala-editor@${wanted || '<version>'}` + (wanted ? '' : ' (use the version of your CDN links or framework wrapper)');
    return result;
  }
  let index;
  try {
    index = buildFroalaIndex(installed.dir);
  } catch (e) {
    result.fatal = `Could not read ${installed.dir}: ${e.message}. Reinstall it: npm i froala-editor@${installed.version}`;
    return result;
  }
  const V = installed.version;
  result.froala = { version: V, dir: path.relative(projectDir, installed.dir) || installed.dir };

  // ----- package.json: froala-editor range, wrappers and their pins
  const spec = allDeps['froala-editor'];
  if (spec !== undefined) {
    if (/^(latest|next|\*|x)?$/.test(String(spec).trim())) add('warning', pkgPath, 0, 'unpinned-dependency', `package.json asks for froala-editor "${spec}", which moves to every new release (including major ones)`, `"froala-editor": "${V}"`);
    else if (satisfies(V, spec) === false) add('error', pkgPath, 0, 'stale-install', `package.json asks for froala-editor "${spec}", but ${V} is installed. node_modules is out of date`, 'npm install');
  }
  const loads = { css: false, pluginsPkgd: false };
  for (const w of WRAPPERS) {
    const wi = findInstalled(projectDir, w);
    if (!wi) {
      if (allDeps[w] !== undefined) add('warning', pkgPath, 0, 'wrapper-not-installed', `package.json lists ${w}, but it is not installed`, 'npm install');
      continue;
    }
    if (allDeps[w] === undefined && ![...texts.values()].some((t) => t.includes(w))) continue; // installed by something else, unused here
    const pin = (wi.pkg.dependencies || {})['froala-editor'] || (wi.pkg.peerDependencies || {})['froala-editor'];
    result.wrappers.push({ name: w, version: wi.version, froalaEditorRange: pin || null });
    if (pin && satisfies(V, pin) === false) {
      const exact = (pin.match(/(\d+\.\d+\.\d+)/) || [])[1];
      add('error', pkgPath, 0, 'wrapper-version', `${w} ${wi.version} depends on froala-editor "${pin}", but froala-editor ${V} is installed`, `npm i froala-editor@${exact || wi.version} (the version the wrapper pins)`);
    }
    const nested = path.join(wi.dir, 'node_modules', 'froala-editor', 'package.json');
    const nestedPkg = fs.existsSync(nested) ? readJson(nested) : null;
    if (nestedPkg && nestedPkg.version !== V) {
      add('error', pkgPath, 0, 'duplicate-froala', `Two copies of froala-editor are installed: ${V} at the top level and ${nestedPkg.version} inside ${w}. The wrapper uses its own copy, so plugins and languages you import register on the other one`, `npm i froala-editor@${nestedPkg.version}`);
    }
    const l = wrapperLoads(wi.dir, wi.pkg);
    loads.css = loads.css || l.css;
    loads.pluginsPkgd = loads.pluginsPkgd || l.pluginsPkgd;
  }

  // ----- project-wide definitions (custom commands, plugins, options, events, template-bound configs)
  const all = [...texts.values()].join('\n');
  const customCommands = new Set([...all.matchAll(/Register(?:Command|QuickInsertButton)\(\s*['"]([^'"]+)['"]/g)].map((x) => x[1]));
  const customPlugins = new Set([...all.matchAll(/PLUGINS(?:\.([A-Za-z_$][\w$]*)|\[\s*['"]([A-Za-z_$][\w$]*)['"]\s*\])\s*=(?!=)/g)].map((x) => x[1] || x[2]));
  const customOptions = new Set([...all.matchAll(/DEFAULTS\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)].map((x) => x[1]));
  for (const x of all.matchAll(/Object\.assign\(\s*(?:[\w$]+\.)?DEFAULTS\s*,\s*\{/g)) {
    const T = tokenize(all.slice(x.index + x[0].length - 1, x.index + x[0].length + 20000));
    for (const { key } of objectKeys(T, 0)) customOptions.add(key);
  }
  const customEvents = new Set();
  for (const x of all.matchAll(/\.(?:trigger|chainTrigger)\(\s*['"]([^'"]+)['"]/g)) for (const e of x[1].split(/\s+/)) customEvents.add(e);
  // identifiers passed to a wrapper as its config in a template
  const boundIn = (t) => {
    const s = new Set();
    for (const x of t.matchAll(/(?:\[froalaEditor\]|(?:v-bind)?:config|\[config\])\s*=\s*["']\s*([A-Za-z_$][\w$]*)\s*["']/g)) s.add(x[1]);
    for (const x of t.matchAll(/<(?:FroalaEditor(?:Component)?|Froala)\b[^>]*?\bconfig=\{\s*(?:this\.)?([A-Za-z_$][\w$]*)\s*\}/g)) s.add(x[1]);
    return s;
  };
  const templateBound = new Set(); // Angular templates live in their own .html files
  for (const [f, t] of texts) if (/\.html?$/i.test(f) && /\[froalaEditor\]/.test(t)) for (const n of boundIn(t)) templateBound.add(n);

  const optionList = [...index.optionNames];
  const usedButtons = []; // { name, file, line }
  const usedPlugins = [];

  // ----- per-file checks
  for (const [file, text] of texts) {
    if (STYLE_EXT.test(file)) continue;
    const at = lineIndex(text);
    // only files that use Froala are checked (a comment that merely mentions it does not count)
    const isFroalaFile = /froala-editor|froala-wysiwyg|froala_editor|FroalaEditor|froalaEditor|<[Ff]roala\b|\$\.FE\b/.test(text);

    // CDN links (any file)
    for (const re of CDN_PATTERNS) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        const ver = m[1];
        const line = at(m.index);
        if (ver && /^(?:\$\{|\{\{|<%|\$[A-Za-z_]|%[A-Za-z_])/.test(ver)) continue; // version filled in by a template or build variable
        if (ver && /^[A-Z][A-Z0-9_]*$/.test(ver)) add('error', file, line, 'cdn-placeholder', `Froala CDN link still has the placeholder "${ver}" instead of a version`, `replace it with the installed version: froala-editor@${V}`);
        else if (!ver) add('error', file, line, 'cdn-unpinned', 'Froala CDN link without a version: it serves whatever release is newest, so the editor changes (or breaks) without a deploy', `pin it to the installed version: froala-editor@${V}`);
        else if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(ver)) add('error', file, line, 'cdn-unpinned', `Froala CDN link uses "${ver}", which moves to new releases (including major ones)`, `pin it to the installed version: froala-editor@${V}`);
        else if (ver !== V) add('error', file, line, 'cdn-version', `Froala CDN link loads ${ver}, but froala-editor ${V} is installed. Mixed versions break plugins and styles`, `use ${V} in every Froala URL (or load the files from node_modules)`);
      }
    }
    if (!isFroalaFile) continue;
    const T = tokenize(text);
    // Variables that hold an editor in this file, whatever their name: `const ed = new FroalaEditor(...)`,
    // `ed = ref.current.getEditor()`, `const e2 = ed`. Their calls are checked like `editor.x.y()`.
    const editorVars = new Set();
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 0; k + 3 < T.length; k++) {
        if (T[k].t !== 'id' || T[k + 1].v !== '=' || T[k + 2].v === '=' || (T[k - 1] && T[k - 1].v === '.')) continue;
        const a = T[k + 2];
        if (a.v === 'new' && T[k + 3].v === 'FroalaEditor') editorVars.add(T[k].v);
        else if (a.t === 'id' && (editorVars.has(a.v) || a.v === 'editor') && !['.', '(', '['].includes(T[k + 3].v)) editorVars.add(T[k].v);
        else {
          for (let q = k + 2; q + 2 < T.length && q < k + 14; q++) {
            if (T[q].v === ';' || T[q].v === '=' || T[q].v === '=>' || T[q].v === '{') break;
            if (T[q].v === 'getEditor' && T[q + 1].v === '(' && T[q + 2].v === ')') {
              if (!T[q + 3] || !['.', '['].includes(T[q + 3].v)) editorVars.add(T[k].v);
              break;
            }
          }
        }
      }
    }
    const tokAt = (s) => {
      let lo = 0;
      let hi = T.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (T[mid].s < s) lo = mid + 1;
        else hi = mid;
      }
      return T[lo] && T[lo].s === s ? lo : -1;
    };

    // jQuery-era (Froala 2) API
    for (const m of text.matchAll(/\.froalaEditor\s*\(/g)) add('error', file, at(m.index), 'jquery-api', 'jQuery plugin call ".froalaEditor(...)" is the Froala 2 API; it does not exist since Froala 3', "const editor = new FroalaEditor('#selector', options); then call editor.html.get() etc. on that instance");
    for (const m of text.matchAll(/\$\.(?:FroalaEditor|FE)\b/g)) add('error', file, at(m.index), 'jquery-api', `"${m[0]}" is the Froala 2 jQuery namespace`, 'use the FroalaEditor class: FroalaEditor.RegisterCommand(...), FroalaEditor.DefineIcon(...)');
    for (const m of text.matchAll(/['"]froalaEditor\.([A-Za-z.]+)['"]/g)) add('error', file, at(m.index), 'v2-event', `"froalaEditor.${m[1]}" is a Froala 2 event name`, `use "${m[1]}" (in events: { ${m[1].split('.').pop()}() { ... } }, "this" is the editor)`);
    for (const m of text.matchAll(/import\s*\{[^}]*\bFroalaEditor\b[^}]*\}\s*from\s*['"]froala-editor['"]/g)) add('error', file, at(m.index), 'named-import', "froala-editor has a default export, not a named FroalaEditor export", "import FroalaEditor from 'froala-editor'");

    // licence option
    for (const m of text.matchAll(/(?:^|[\s{,(])['"]?(licenseKey|licenceKey|activationKey)['"]?\s*:/gm)) {
      if (index.isOption(m[1])) continue;
      add('error', file, at(m.index + m[0].indexOf(m[1])), 'license-key', `"${m[1]}" is not a Froala option, so the licence key is ignored`, "the licence option is key: key: 'YOUR-ACTIVATION-KEY'");
    }

    // ---- option objects
    const checkEvents = (k, severity) => {
      for (const { key, s } of objectKeys(T, k)) {
        if (/^froalaEditor\./.test(key)) continue; // reported above
        if (index.strings.has(key) || customEvents.has(key)) continue;
        const near = nearest(key, knownEvents(index));
        add(severity, file, at(s), 'unknown-event', `Event "${key}" does not exist in froala-editor ${V}`, near ? `did you mean "${near}"?` : 'see https://froala.com/wysiwyg-editor/docs/events/');
      }
    };
    const checkArrowHandlers = (k, what) => {
      for (const { key, i } of objectKeys(T, k)) {
        let j = i + 2;
        if (T[i + 1].v !== ':') continue;
        if (T[j] && T[j].t === 'id' && T[j].v === 'async') j++;
        let arrowAt = -1;
        if (T[j] && T[j].v === '(') { const c = closeOf(T, j); if (T[c + 1] && T[c + 1].v === '=>') arrowAt = c + 1; } else if (T[j] && T[j].t === 'id' && T[j + 1] && T[j + 1].v === '=>') arrowAt = j + 1;
        if (arrowAt < 0 || !T[arrowAt + 1] || T[arrowAt + 1].v !== '{') continue;
        const end = closeOf(T, arrowAt + 1);
        for (let q = arrowAt + 2; q < end; q++) {
          if (T[q].t === 'id' && T[q].v === 'this' && T[q + 1] && T[q + 1].v === '.' && T[q + 2] && index.moduleIndex.has(T[q + 2].v)) {
            add('warning', file, at(T[i].s), 'arrow-this', `${what} "${key}" is an arrow function but uses this.${T[q + 2].v}: in an arrow function "this" is not the editor`, `${key}() { ... } (a regular function; Froala calls it with the editor as "this")`);
            break;
          }
        }
      }
    };
    const checkOptions = (k, strong, label) => {
      const keys = objectKeys(T, k);
      if (!strong) {
        const known = keys.filter(({ key }) => index.isOption(key)).length;
        if (known < 2 || known * 2 < keys.length) return;
      }
      for (const { key, s, i } of keys) {
        if (/^(licenseKey|licenceKey|activationKey)$/.test(key)) continue; // reported above
        if (key === 'events') {
          if (T[i + 1] && T[i + 1].v === ':' && T[i + 2] && T[i + 2].v === '{') { checkEvents(i + 2, strong ? 'error' : 'warning'); checkArrowHandlers(i + 2, 'Event handler'); }
          continue;
        }
        if (index.isOption(key) || customOptions.has(key)) continue;
        const near = nearest(key, optionList);
        const fix = near ? `did you mean "${near}"?` : 'remove it, or see https://froala.com/wysiwyg-editor/docs/options/';
        // a name the package uses somewhere (e.g. iframe_document, read straight from the constructor argument) may be
        // an undocumented option: warn instead of failing
        if (index.tokens.has(key)) add('warning', file, at(s), 'unknown-option', `"${key}" is not one of the editor's default options in froala-editor ${V} (the package uses the name, but not as a documented option)${label ? ` (${label})` : ''}`, fix);
        else add(strong ? 'error' : 'warning', file, at(s), 'unknown-option', `Option "${key}" does not exist in froala-editor ${V}${label ? ` (${label})` : ''}`, fix);
      }
    };
    // true when T[k] is an attribute name inside a JSX/Svelte opening tag (<Froala config={config} />)
    const isJsxAttr = (k) => {
      for (let m = k - 1; m >= 0; m--) {
        const t = T[m];
        if (t.v === '}') {
          let d = 0;
          for (; m >= 0; m--) {
            if (T[m].v === '}') d++;
            else if (T[m].v === '{' && --d === 0) break;
          }
          continue;
        }
        if (t.t === 'str' || t.t === 'id' || t.v === '=' || t.v === '-' || t.v === ':' || t.v === '.') continue;
        return t.v === '<';
      }
      return false;
    };
    const varObject = (name) => {
      // "name = {" (also this.name = {, name: Type = {, through ref( / reactive( / $state( / useState( / useMemo(() => ( )
      const found = [];
      for (let k = 0; k + 2 < T.length; k++) {
        if (T[k].t !== 'id' || T[k].v !== name || isJsxAttr(k)) continue;
        if (T[k - 1] && T[k - 1].v === '.' && !(T[k - 2] && T[k - 2].v === 'this')) continue;
        let j = k + 1;
        if (T[j] && T[j].v === ':') { let g = 0; while (j < T.length && !(g === 0 && (T[j].v === '=' || T[j].v === ';' || T[j].v === ','))) { if (T[j].v === '<') g++; else if (T[j].v === '>') g--; else if (T[j].v === '{' || T[j].v === '(') break; j++; } }
        if (!T[j] || T[j].v !== '=' || (T[j + 1] && T[j + 1].v === '=')) continue;
        j++;
        for (let hops = 0; hops < 6 && T[j] && T[j].v !== '{'; hops++) {
          if (T[j].t === 'id' && ['ref', 'reactive', 'shallowRef', '$state', 'useState', 'useMemo', 'useRef', 'computed', 'Object', 'signal'].includes(T[j].v)) { j++; continue; }
          if (T[j].v === '(' || T[j].v === ')' || T[j].v === '=>' || T[j].v === 'freeze' || T[j].v === '.') { j++; continue; }
          break;
        }
        if (T[j] && T[j].v === '{') found.push(j);
      }
      return found;
    };
    const localStrong = boundIn(text); // config objects bound in this file (JSX config={x}, Vue :config="x")
    const apiRanges = []; // arguments of RegisterCommand(...) etc.: their "options" are dropdown entries, not editor options
    for (let k = 0; k + 1 < T.length; k++) {
      if (T[k].t === 'id' && /^(?:RegisterCommand|RegisterQuickInsertButton|RegisterShortcut|DefineIcon|DefineIconTemplate)$/.test(T[k].v) && T[k + 1].v === '(') apiRanges.push([k + 1, closeOf(T, k + 1)]);
    }
    const inApiCall = (k) => apiRanges.some(([a, b]) => k > a && k < b);
    for (let k = 0; k + 3 < T.length; k++) {
      const x = T[k];
      if (x.v === 'new' && T[k + 1] && T[k + 1].v === 'FroalaEditor' && T[k + 2] && T[k + 2].v === '(') {
        const end = closeOf(T, k + 2);
        let q = k + 3;
        for (; q < end && T[q].v !== ','; q++) if (isOpen(T[q])) q = closeOf(T, q);
        const arg = T[q + 1];
        if (q < end && arg) {
          if (arg.v === '{') checkOptions(q + 1, true);
          else if (arg.t === 'id') localStrong.add(arg.v);
        }
      }
      // JSX / Svelte: <FroalaEditorComponent config={{ ... }} />
      if (x.t === 'id' && x.v === 'config' && T[k + 1].v === '=' && T[k + 2].v === '{' && T[k + 3] && T[k + 3].v === '{' && /<(?:FroalaEditor(?:Component)?|Froala)\b/.test(text)) checkOptions(k + 3, true);
      if (x.t === 'id' && STRONG_CONFIG.test(x.v)) localStrong.add(x.v);
      // FroalaEditor.<Static> and FroalaEditor.DEFAULTS.<option>
      if (x.t === 'id' && x.v === 'FroalaEditor' && T[k + 1].v === '.' && T[k + 2].t === 'id' && !(T[k - 1] && T[k - 1].v === '.')) {
        const prop = T[k + 2].v;
        if (!index.tokens.has(prop)) {
          const near = nearest(prop, [...index.tokens].filter((t) => /^[A-Z][A-Za-z_]{3,}$/.test(t)));
          add('error', file, at(T[k + 2].s), 'unknown-static', `"FroalaEditor.${prop}" does not exist in froala-editor ${V}`, near ? `did you mean "FroalaEditor.${near}"?` : null);
        } else if (prop === 'DEFAULTS' && T[k + 3] && T[k + 3].v === '.' && T[k + 4] && T[k + 4].t === 'id') {
          const opt = T[k + 4].v;
          const assigned = T[k + 5] && T[k + 5].v === '=' && !(T[k + 6] && T[k + 6].v === '=');
          if (!assigned && !index.isOption(opt) && !customOptions.has(opt)) {
            const near = nearest(opt, optionList);
            add('error', file, at(T[k + 4].s), 'unknown-option', `Option "${opt}" does not exist in froala-editor ${V}`, near ? `did you mean "${near}"?` : null);
          }
        }
      }
      // DefineIcon('x', { template: 'svg', SVG: ... }) renders an empty icon
      if (x.t === 'id' && x.v === 'DefineIcon' && T[k + 1].v === '(') {
        const end = closeOf(T, k + 1);
        for (let q = k + 2; q < end; q++) {
          if (T[q].v === '{') {
            for (const { key, s } of objectKeys(T, q)) if (key === 'SVG') add('error', file, at(s), 'defineicon-svg', 'DefineIcon has no "SVG" key, so the icon renders empty', "use { template: 'svg', PATH: 'M…', VIEWBOX: '0 0 24 24' }");
            break;
          }
        }
      }
      // RegisterCommand('x', { callback: () => this... })
      if (x.t === 'id' && x.v === 'RegisterCommand' && T[k + 1].v === '(') {
        const end = closeOf(T, k + 1);
        for (let q = k + 2; q < end; q++) if (T[q].v === '{') { checkArrowHandlers(q, 'Command option'); break; }
      }
    }
    // config: { ... } keys and name = { ... } assignments
    for (let k = 1; k + 2 < T.length; k++) {
      const x = T[k];
      if (x.t !== 'id' || T[k + 1].v !== ':' || T[k + 2].v !== '{' || T[k - 1].v === '.' || T[k - 1].v === '?' || inApiCall(k)) continue;
      if (localStrong.has(x.v)) checkOptions(k + 2, true);
      else if (GENERIC_CONFIG.test(x.v)) checkOptions(k + 2, false);
    }
    // name = { ... }: also names bound in another file's template (Angular [froalaEditor]="options" in a .html file)
    const strongVars = new Set([...localStrong, ...templateBound]);
    for (const name of strongVars) for (const o of varObject(name)) if (!inApiCall(o)) checkOptions(o, true);
    for (const name of ['config', 'options', 'opts', 'settings', 'cfg']) if (!strongVars.has(name)) for (const o of varObject(name)) if (!inApiCall(o)) checkOptions(o, false);
    // Vue :config="{ ... }", Angular [froalaEditor]="{ ... }" / [config]="{ ... }"
    for (const m of text.matchAll(/(?:(?:v-bind)?:(?:config|options)|\[(?:froalaEditor|config|options)\])\s*=\s*"\s*\{/g)) {
      const attrEnd = text.indexOf('"', m.index + m[0].length);
      const offset = m.index + m[0].length - 1;
      const inner = text.slice(offset, attrEnd < 0 ? text.length : attrEnd);
      const AT = tokenize(inner);
      if (!AT.length || AT[0].v !== '{') continue;
      for (const { key, s } of objectKeys(AT, 0)) {
        if (key === 'events' || index.isOption(key) || customOptions.has(key) || /^(licenseKey|licenceKey|activationKey)$/.test(key)) continue;
        const near = nearest(key, optionList);
        add('error', file, at(offset + s), 'unknown-option', `Option "${key}" does not exist in froala-editor ${V}`, near ? `did you mean "${near}"?` : null);
      }
    }

    // ---- toolbar buttons: flat, grouped ([['bold'], ['italic']]) and object ({ moreText: { buttons: [...] } }) forms
    const checkButton = (name, s) => {
      if (['|', '-'].includes(name)) return;
      if (index.commands.has(name)) { usedButtons.push({ name, file, line: at(s) }); return; }
      if (customCommands.has(name)) return;
      const near = nearest(name, [...index.commands]);
      const row = index.pluginRows.find((r) => r.plugins.includes(name) && r.cmds.length);
      const rank = (c) => (c.toLowerCase().includes(name.toLowerCase()) ? 0 : 2) + (/^insert/.test(c) ? 0 : 1);
      const fix = row ? `"${name}" is a plugin name; its main toolbar button(s): ${[...row.cmds].sort((a, b) => rank(a) - rank(b)).slice(0, 3).join(', ')}` : near ? `did you mean "${near}"?` : 'register it with FroalaEditor.RegisterCommand, or remove it';
      add('error', file, at(s), 'unknown-button', `Toolbar button "${name}" is not a command in froala-editor ${V} (and is not registered with FroalaEditor.RegisterCommand in this project), so it does not render`, fix);
    };
    const walkButtons = (k) => {
      const tk = T[k];
      if (!tk) return;
      if (tk.v === '[') {
        const end = closeOf(T, k);
        for (let q = k + 1; q < end; q++) {
          const x = T[q];
          if (x.t === 'str' && T[q - 1] && T[q - 1].t === 'p' && ['[', ','].includes(T[q - 1].v) && T[q + 1] && [',', ']'].includes(T[q + 1].v)) checkButton(x.v, x.s);
          else if (x.v === '[' || x.v === '{') { walkButtons(q); q = closeOf(T, q); } else if (isOpen(x)) q = closeOf(T, q);
        }
      } else if (tk.v === '{') {
        const end = closeOf(T, k);
        for (const { i } of objectKeys(T, k)) {
          if (i < 0 || i > end || T[i + 1].v !== ':') continue;
          const v = T[i + 2];
          if (v && (v.v === '[' || v.v === '{')) walkButtons(i + 2);
        }
      }
    };
    for (let k = 0; k + 2 < T.length; k++) {
      const x = T[k];
      if ((x.t === 'id' || x.t === 'str') && /^toolbarButtons\w*$/.test(x.v) && T[k + 1].t === 'p' && (T[k + 1].v === ':' || T[k + 1].v === '=') && (T[k + 2].v === '[' || T[k + 2].v === '{')) {
        if (T[k - 1] && T[k - 1].v === '.' && T[k + 1].v === ':') continue;
        walkButtons(k + 2);
      }
    }

    // ---- pluginsEnabled / pluginsDisabled
    for (let k = 0; k + 2 < T.length; k++) {
      if (!((T[k].t === 'id' || T[k].t === 'str') && /^plugins(?:Enabled|Disabled)$/.test(T[k].v) && (T[k + 1].v === ':' || T[k + 1].v === '=') && T[k + 2].v === '[')) continue;
      const end = closeOf(T, k + 2);
      for (let q = k + 3; q < end; q++) {
        const v = T[q];
        if (v.t !== 'str') continue;
        if (index.allPluginNames.has(v.v)) { if (T[k].v === 'pluginsEnabled') usedPlugins.push({ name: v.v, file, line: at(v.s) }); continue; }
        if (customPlugins.has(v.v)) continue;
        const near = nearest(v.v, [...index.allPluginNames]);
        add('error', file, at(v.s), 'unknown-plugin', `"${v.v}" is not a plugin name in froala-editor ${V}`, near ? `did you mean "${near}"? (plugin names are camelCase: file image_manager.min.js is plugin "imageManager")` : 'see https://froala.com/wysiwyg-editor/docs/plugins/');
      }
    }

    // ---- events.on('name', ...)
    for (let k = 2; k + 4 < T.length; k++) {
      if (!(T[k].t === 'id' && T[k].v === 'events' && T[k - 1].v === '.' && T[k + 1].v === '.' && T[k + 2].v === 'on' && T[k + 3].v === '(' && T[k + 4].t === 'str')) continue;
      const recv = T[k - 2];
      if (!(recv.t === 'id' && (EDITOR_RECEIVER.test(recv.v) || editorVars.has(recv.v) || recv.v === 'this')) && !(recv.v === ')' && T[k - 4] && T[k - 4].v === 'getEditor')) continue;
      for (const ev of T[k + 4].v.split(/\s+/).filter(Boolean)) {
        if (/^froalaEditor\./.test(ev) || index.strings.has(ev) || customEvents.has(ev)) continue;
        const near = nearest(ev, knownEvents(index));
        add('warning', file, at(T[k + 4].s), 'unknown-event', `Event "${ev}" does not exist in froala-editor ${V} (fine if your own code triggers it)`, near ? `did you mean "${near}"?` : null);
      }
    }

    // ---- <editor>.<module>.<method>( calls
    for (let k = 0; k + 5 < T.length; k++) {
      const r = T[k];
      const viaGetEditor = r.v === ')' && T[k - 1] && T[k - 1].v === '(' && T[k - 2] && T[k - 2].v === 'getEditor';
      if (!(r.t === 'id' || viaGetEditor)) continue;
      const recv = viaGetEditor ? 'getEditor()' : r.v;
      const isThis = recv === 'this';
      if (!isThis && !EDITOR_RECEIVER.test(recv) && !editorVars.has(recv)) continue;
      const strictRecv = !isThis && (FROALA_RECEIVER.test(recv) || editorVars.has(recv));
      let j = k + 1;
      if (T[j].v === '?') j++;
      if (T[j].v !== '.' || !T[j + 1] || T[j + 1].t !== 'id') continue;
      const mod = T[j + 1].v;
      let q = j + 2;
      if (T[q] && T[q].v === '?') q++;
      if (!T[q] || T[q].v !== '.' || !T[q + 1] || T[q + 1].t !== 'id' || !T[q + 2] || T[q + 2].v !== '(') continue;
      const method = T[q + 1].v;
      if (!/^[a-z]/.test(mod) || NOT_MODULES.has(mod) || customPlugins.has(mod)) continue;
      const entry = index.moduleIndex.get(mod);
      if (!entry) {
        if (strictRecv) {
          const near = nearest(mod, [...index.moduleIndex.keys()]);
          add('warning', file, at(r.s), 'unknown-module', `"${recv}.${mod}.${method}()": the editor has no "${mod}" module or plugin in froala-editor ${V}`, near ? `did you mean "${recv}.${near}"?` : null);
        }
        continue;
      }
      if (isThis && GENERIC_MODULE_WORDS.has(mod)) continue;
      const known = index.modulePair(mod, method);
      if (known !== false) continue;
      const near = nearest(method, [...entry.methods]);
      // a distinctive method name that lives on another module (html.getMarkdown -> markdown.getMarkdown); short
      // generic names (off, get, show) are not matched across modules, where the meaning differs
      const elsewhere = method.length < 6 ? [] : [...index.moduleIndex].filter(([m, e]) => m !== mod && e.methods.has(method)).map(([m]) => m);
      const pub = [...entry.methods].filter((x) => !/^[_$]/.test(x)).sort();
      const fix = elsewhere.length ? `"${method}" is a method of the ${elsewhere.join(' / ')} module: ${recv}.${elsewhere[0]}.${method}()` : near ? `did you mean "${mod}.${near}()"?` : `methods of ${mod}: ${pub.join(', ')}`;
      add(strictRecv ? 'error' : 'warning', file, at(r.s), 'unknown-method', `"${mod}.${method}()" is not a method of the ${mod} module in froala-editor ${V}`, fix);
    }
  }

  // ----- loading heuristics: CSS and the plugin files behind the buttons and plugins in use
  const loadText = [...texts.values(), ...loaderTexts].join('\n');
  const usesFroalaJs = /from\s+['"]froala-editor['"]|require\(\s*['"]froala-editor['"]\s*\)|import\s*\(\s*['"]froala-editor['"]|['"]froala-editor\/js\/|froala_editor(?:\.pkgd)?(?:\.min)?\.js|(?:react|vue|angular|svelte)-froala-wysiwyg/.test(loadText);
  if (usesFroalaJs) {
    const cssLoaded = loads.css || /froala_editor(?:\.pkgd)?(?:\.min)?\.css|froala-editor\/css\//.test(loadText);
    if (!cssLoaded) {
      const first = [...texts].find(([, t]) => /froala-editor|froala-wysiwyg|froala_editor/.test(t));
      const firstLine = first ? lineIndex(first[1])(first[1].search(/froala-editor|froala-wysiwyg|froala_editor/)) : 0;
      add('warning', first ? first[0] : null, firstLine, 'missing-css', 'Froala JavaScript is loaded, but no Froala stylesheet was found in the scanned files: the toolbar and popups will look broken', "import 'froala-editor/css/froala_editor.pkgd.min.css' (and 'froala-editor/css/froala_style.min.css' where you display saved content)");
    }
    const editorPkgd = /froala_editor\.pkgd(?:\.min)?\.js/.test(loadText);
    const pluginsPkgd = loads.pluginsPkgd || /plugins\.pkgd(?:\.min)?\.js/.test(loadText);
    const loadedFiles = new Set([...loadText.matchAll(/\/js\/(plugins|third_party)\/([a-z_]+)(?:\.min)?(?:\.js)?/g)].map((m) => `js/${m[1]}/${m[2]}.min.js`));
    const isLoaded = (row) => loadedFiles.has(row.file) || (pluginsPkgd && row.inPluginsPkgd) || (editorPkgd && row.inPkgd);
    const howTo = (row) => (row.inPluginsPkgd ? `import 'froala-editor/${row.file}' (or 'froala-editor/js/plugins.pkgd.min.js' for all bundled plugins)` : `import 'froala-editor/${row.file}' (it is not in the pkgd bundles)`);
    for (const b of usedButtons) {
      if (index.coreCommands.has(b.name) || customCommands.has(b.name)) continue;
      const rows = index.pluginRows.filter((r) => r.cmds.includes(b.name));
      if (!rows.length || rows.some(isLoaded)) continue;
      add('warning', b.file, b.line, 'plugin-not-loaded', `Toolbar button "${b.name}" comes from ${rows[0].file}, which this project does not appear to load, so the button will not render`, howTo(rows[0]));
    }
    for (const p of usedPlugins) {
      const rows = index.pluginRows.filter((r) => r.plugins.includes(p.name));
      if (!rows.length || rows.some(isLoaded)) continue;
      add('warning', p.file, p.line, 'plugin-not-loaded', `Plugin "${p.name}" is enabled, but its file ${rows[0].file} does not appear to be loaded`, howTo(rows[0]));
    }
  }

  const order = (f) => `${f.file === 'package.json' ? '' : f.file}\u0000${String(f.line).padStart(7, '0')}`;
  result.findings.sort((a, b) => (order(a) < order(b) ? -1 : order(a) > order(b) ? 1 : 0));
  result.errors = result.findings.filter((f) => f.severity === 'error').length;
  result.warnings = result.findings.filter((f) => f.severity === 'warning').length;
  return result;
}

let eventCache = null;
function knownEvents(index) {
  // event-looking strings: names that the docs list as events are quoted in the source; offer the common ones as suggestions
  if (eventCache && eventCache.index === index) return eventCache.list;
  const list = [...new Set([...index.froalaSource.matchAll(/["']((?:[a-z]+\.)?(?:before|after|on)?[a-z]+[A-Z][A-Za-z]*(?:\.[a-z][A-Za-z]*)?)["']/g)].map((m) => m[1]))].filter((n) => !index.optionNames.has(n));
  eventCache = { index, list };
  return list;
}

// ---------- command line ----------
function usage() {
  return [
    'Usage: node check-froala.mjs [projectDir] [files or folders...] [--json]',
    '',
    'Checks Froala options, events, methods, plugin names and toolbar buttons in your code against the',
    'froala-editor version installed in node_modules, plus wrapper/version mismatches and stale (Froala 2) patterns.',
    'Exit codes: 0 no errors, 1 errors found, 2 cannot run. Read-only: no network, no writes.',
  ].join('\n');
}
export function main(argv, { cwd = process.cwd(), log = console.log } = {}) {
  const positional = [];
  let json = false;
  for (const a of argv) {
    if (a === '--json') json = true;
    else if (a === '-h' || a === '--help') { log(usage()); return 0; } else if (a.startsWith('--')) { log(`Unknown option ${a}\n\n${usage()}`); return 2; } else positional.push(a);
  }
  let projectDir = cwd;
  if (positional.length) {
    const first = path.resolve(cwd, positional[0]);
    const isProject = fs.existsSync(first) && fs.statSync(first).isDirectory() && (fs.existsSync(path.join(first, 'package.json')) || fs.existsSync(path.join(first, 'node_modules')));
    if (isProject) { projectDir = first; positional.shift(); }
  }
  if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
    const msg = `Project folder not found: ${projectDir}`;
    log(json ? JSON.stringify({ fatal: msg }, null, 2) : `check-froala: ${msg}`);
    return 2;
  }
  let result;
  try {
    result = checkProject({ projectDir, targets: positional, cwd });
  } catch (e) {
    result = { fatal: `internal error: ${e && e.message}` };
  }
  if (json) {
    log(JSON.stringify(result, null, 2));
  } else if (result.fatal) {
    log(`check-froala: cannot run. ${result.fatal}`);
  } else {
    const w = result.wrappers.map((x) => `${x.name} ${x.version}`).join(', ');
    log(`check-froala: froala-editor ${result.froala.version} (${result.froala.dir})${w ? `, ${w}` : ''}; ${result.filesScanned} file(s) scanned`);
    for (const f of result.findings) {
      log(`${f.severity === 'error' ? 'ERROR  ' : 'warning'} ${f.file}${f.line ? `:${f.line}` : ''}  ${f.message}${f.fix ? `\n          fix: ${f.fix}` : ''}`);
    }
    log(`\n${result.errors} error(s), ${result.warnings} warning(s)`);
  }
  if (result.fatal) return 2;
  return result.errors ? 1 : 0;
}

const invokedDirectly = (() => {
  try {
    return !!process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (invokedDirectly) process.exitCode = main(process.argv.slice(2));
