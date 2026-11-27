#!/usr/bin/env node
// Builds an Agent Skills Discovery index (schema 0.2.0) for the skills in skills/:
//
//   <out>/index.json            {"$schema", "skills": [{name, type: "archive", description, url, digest}]}
//   <out>/<name>-<version>.tar.gz   the skill's git-tracked files at the archive root
//
// Host the output directory at https://<domain>/.well-known/agent-skills/ so that
// `npx skills add https://<domain>` can install the skills. The release workflow attaches
// the output to the GitHub release.
//
// Usage: node scripts/build-discovery-index.mjs [--out dist/agent-skills] [--base-url /.well-known/agent-skills]
// Zero dependencies; needs git and tar (GNU tar or bsdtar).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const value = args[i + 1];
  if (!value || value.startsWith('--')) fail(`${name} needs a value`);
  return value;
};
for (const a of args) {
  if (a.startsWith('--') && !['--out', '--base-url'].includes(a)) fail(`unknown option ${a}`);
}
const OUT = path.resolve(ROOT, opt('--out', 'dist/agent-skills'));
const BASE_URL = opt('--base-url', '/.well-known/agent-skills').replace(/\/+$/, '');

function fail(message) {
  console.error(`build-discovery-index: ${message}`);
  process.exit(1);
}

function run(cmd, cmdArgs, options = {}) {
  return execFileSync(cmd, cmdArgs, { encoding: 'utf8', ...options });
}

// Minimal frontmatter reader for the fields the index needs (name, description, metadata.version).
function readFrontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) fail(`${file}: no frontmatter`);
  const lines = m[1].split(/\r?\n/);
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let kv = line.match(/^([a-z_-]+):\s*(.*)$/);
    if (kv) {
      const [, key, rest] = kv;
      if (rest === '>' || rest === '|' || rest === '>-' || rest === '|-') {
        const block = [];
        while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i].trim());
        out[key] = rest.startsWith('>') ? block.join(' ') : block.join('\n');
      } else {
        out[key] = rest.replace(/^["']|["']$/g, '');
      }
      continue;
    }
    kv = line.match(/^\s+version:\s*["']?([^"'\s]+)["']?\s*$/);
    if (kv && !out.version) out.version = kv[1];
  }
  return out;
}

const skillsDir = path.join(ROOT, 'skills');
const names = fs.readdirSync(skillsDir).filter((d) => fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))).sort();
if (!names.length) fail('no skills found');

// OUT is deleted and rebuilt, so refuse anything that is not a previous build: the repo itself, a folder
// above it, or a folder that already holds other files (`--out skills` must not wipe the skills).
const fromOut = path.relative(OUT, ROOT);
if (!fromOut || (!fromOut.startsWith('..') && !path.isAbsolute(fromOut))) fail(`--out ${OUT} is this repository or a folder above it`);
if (fs.existsSync(OUT) && fs.readdirSync(OUT).length && !fs.existsSync(path.join(OUT, 'index.json'))) {
  fail(`--out ${OUT} already has files and is not an earlier discovery index (no index.json); use an empty folder`);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const index = { $schema: SCHEMA, skills: [] };
for (const name of names) {
  const dir = path.join('skills', name);
  const fm = readFrontmatter(path.join(ROOT, dir, 'SKILL.md'));
  if (fm.name !== name) fail(`${dir}/SKILL.md: name "${fm.name}" does not match the folder`);
  if (!fm.description) fail(`${dir}/SKILL.md: no description`);
  if (!fm.version) fail(`${dir}/SKILL.md: no metadata.version`);

  // Only git-tracked files ship, so a stray local file can never end up on users' machines.
  const files = run('git', ['ls-files', '-z', '--', '.'], { cwd: path.join(ROOT, dir) })
    .split('\0').filter(Boolean).sort();
  for (const f of files) {
    if (!fs.existsSync(path.join(ROOT, dir, f))) fail(`${dir}/${f} is tracked but missing (commit or restore it first)`);
  }
  if (!files.includes('SKILL.md')) fail(`${dir}/SKILL.md is not tracked by git`);

  const archive = `${name}-${fm.version}.tar.gz`;
  run('tar', ['--format=ustar', '--numeric-owner', '-czf', path.join(OUT, archive), '-C', path.join(ROOT, dir), '--', ...files], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  });
  // bsdtar can skip an entry and still exit 0, so check what was written.
  const listed = run('tar', ['-tzf', path.join(OUT, archive)]).split(/\r?\n/).filter(Boolean).sort();
  if (JSON.stringify(listed) !== JSON.stringify(files)) fail(`${archive}: archive contents differ from git`);

  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT, archive))).digest('hex');
  index.skills.push({
    name,
    type: 'archive',
    description: fm.description,
    url: `${BASE_URL}/${archive}`,
    digest: `sha256:${digest}`,
  });
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`Wrote ${index.skills.length} skills to ${path.relative(ROOT, OUT) || '.'}/index.json`);
