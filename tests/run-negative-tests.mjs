#!/usr/bin/env node
// Negative tests: the validator must report every deliberately broken example in tests/fixtures.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = spawnSync('node', [path.join(ROOT, 'scripts/validate-skills.mjs'), '--skills-dir', path.join(ROOT, 'tests/fixtures')], { encoding: 'utf8' });
const out = run.stdout + run.stderr;

const expected = [
  ['NEG-1 licenseKey in code', /"licenseKey" is used as an option/],
  ['NEG-2 unknown plugin', /"notAPlugin" is not a plugin name/],
  ['NEG-3 misspelled button', /Toolbar button "aiAsist"/],
  ['NEG-4 release-notes option', /"aiAssistAutoComplete" is not an option/],
  ['NEG-5 misspelled event', /Event "word\.afterImprt" does not exist/],
  ['NEG-6 unknown method', /"html\.nonexistentMethod\(\)" was not found/],
  ['NEG-7 hard-coded version', /Hard-coded "froala-editor@5\.5\.0"/],
];
let failed = 0;
for (const [name, re] of expected) {
  const ok = re.test(out);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
if (run.status === 0) { failed++; console.log('FAIL  validator exited with 0 on broken fixtures'); }
if (failed) { console.log('\n' + out); process.exit(1); }
console.log(`\nAll ${expected.length} negative tests passed.`);
