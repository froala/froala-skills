#!/usr/bin/env node
// Validator tests. Each fixture under tests/fixtures is a skills folder (or a mini repo) with deliberately
// broken examples; the validator must report EXACTLY the listed errors and warnings, no more and no fewer.
// The "positive" fixture must pass with exit code 0. Dependency-free: node:test + node:assert.
//
//   node tests/run-negative-tests.mjs
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(ROOT, 'tests', 'fixtures');
const VALIDATOR = path.join(ROOT, 'scripts', 'validate-skills.mjs');
const ALLOWLIST = path.join(FIX, 'allowlist.json');
const V = 'froala-editor 5.6.0';

function run(args, env = {}) {
  const e = { ...process.env, ...env };
  if (!('GITHUB_ACTIONS' in env)) delete e.GITHUB_ACTIONS; // plain output unless a test asks for annotations
  const r = spawnSync(process.execPath, [VALIDATOR, ...args], { encoding: 'utf8', env: e, cwd: ROOT });
  return { status: r.status, out: r.stdout + r.stderr };
}
// Lines "ERROR    <file>:<line>  <msg>" / "warning  ..." with the fixture prefix removed.
function findings(out, prefix) {
  return out.split('\n').filter((l) => /^(ERROR|warning) {2,}/.test(l)).map((l) => l.replace(/^(ERROR|warning) +/, (m, k) => `${k === 'ERROR' ? 'E' : 'W'} `).replace(prefix, '')).sort();
}
function expectExactly(name, args, prefix, expected, { status = 1 } = {}) {
  test(name, () => {
    const r = run([...args, '--allowlist', ALLOWLIST]);
    assert.equal(r.status, status, `exit code\n${r.out}`);
    assert.deepEqual(findings(r.out, prefix), [...expected].sort(), r.out);
  });
}
const skills = (fixture) => ['--skills-dir', path.join(FIX, fixture, 'skills')];
const pre = (fixture) => `tests/fixtures/${fixture}/skills/`;
const notFound = (t) => `"${t}" was not found in ${V} or its wrappers. Fix it, or add it to scripts/validate-allowlist.json with a reason.`;
const notMethod = (mod, m) => `"${mod}.${m}()" is not a method of the ${mod} module in ${V}`;
const button = (b) => `Toolbar button "${b}" is not a command in ${V}`;
const plugin = (p) => `"${p}" is not a plugin name in ${V} (see references/plugin-names.md)`;
const option = (o) => `Option "${o}" does not exist in ${V}`;
const event = (e) => `Event "${e}" does not exist in ${V}`;
const hardcoded = (v) => `Hard-coded "${v}". Use "@VERSION" (or VERSION) and tell the agent to use the installed version.`;
const trigger = (t) => `Description trigger "${t}" was not found in ${V} or its wrappers. Triggers must be real Froala APIs (or add it to the allowlist with a reason).`;
const utm = (url) => `Docs link needs utm_source=froala-skills&utm_medium=agent-skill&utm_content=utm (run --fix-utm): ${url}`;
const mismatch = (where, v) => `Version mismatch: ${where} is ${v}, but most of the repo says 1.2.0. plugin.json, .claude-plugin/plugin.json, marketplace.json, every skill's metadata.version and the top CHANGELOG entry must match.`;

// Known-good pairs, allowlisted names in their own category, validate:skip, info strings, ~~~ fences,
// grouped/object toolbars, Vue/JSX configs, custom plugins/commands/options, unrelated fetch/response objects.
expectExactly('positive fixture passes', skills('positive'), pre('positive'), [], { status: 0 });

// 1. info strings and ~~~ fences no longer mis-pair later fences; unclosed fences are reported
expectExactly('fences: info strings, tildes, nested and unclosed fences', skills('fences'), pre('fences'), [
  `E fences/SKILL.md:15  ${notFound('notARealApiX')}`,
  `E fences/SKILL.md:18  ${button('notAButtonFence')}`,
  `E fences/SKILL.md:22  ${notMethod('html', 'notAMethodTilde')}`,
  'E fences/SKILL.md:31  Code fence "```js" is never closed',
  `E fences/SKILL.md:32  ${notMethod('events', 'notClosedMethod')}`,
]);

// 2/4/8. module.method pairs, any receiver, FroalaEditor.<Static>, inline code incl. table cells with arguments
expectExactly('methods: module.method pairs on any receiver', skills('methods'), pre('methods'), [
  `E methods/SKILL.md:12  ${notMethod('events', 'bind')}`,
  `E methods/SKILL.md:13  ${notMethod('html', 'getMarkdown')}`,
  `E methods/SKILL.md:14  ${notMethod('events', 'off')}`,
  `E methods/SKILL.md:15  ${notMethod('html', 'nonexistentMethod')}`,
  `E methods/SKILL.md:16  ${notMethod('undo', 'notThere')}`,
  `E methods/SKILL.md:17  ${notMethod('html', 'alsoMissing')}`,
  `E methods/SKILL.md:18  "FroalaEditor.RegisterComand" was not found in ${V}`,
  `E methods/SKILL.md:19  "text.get()": the editor has no "text" module or plugin in ${V}`,
  `E methods/SKILL.md:24  ${notFound('editor.events.off()')}`,
  `E methods/SKILL.md:26  ${notFound('FroalaEditor.RegisterComand')}`,
  `E methods/SKILL.md:26  ${notFound('events.blur()')}`,
  `E methods/SKILL.md:26  ${notFound('html.getMarkdown')}`,
]);

// 3/6. grouped and object toolbars, buildList, JSON fences
expectExactly('toolbar: nested groups, object form, buildList, json', skills('toolbar'), pre('toolbar'), [
  `E toolbar/SKILL.md:13  ${button('notAButtonX')}`,
  `E toolbar/SKILL.md:14  ${button('notAButtonY')}`,
  `E toolbar/SKILL.md:15  ${plugin('notAPlugin')}`,
  `E toolbar/SKILL.md:17  ${button('notAButtonZ')}`,
  `E toolbar/SKILL.md:21  ${button('notAButtonJson')}`,
  `E toolbar/SKILL.md:21  ${plugin('notAPluginJson')}`,
]);

// 5/6. option objects: new FroalaEditor literal and variable, config objects, DEFAULTS, JSX, Vue :config, single words
expectExactly('options: every editor configuration object', skills('options'), pre('options'), [
  `E options/SKILL.md:12  ${event('word.afterImprt')}`,
  `E options/SKILL.md:12  ${option('heigth')}`,
  'E options/SKILL.md:12  "licenseKey" is used as an option, but it is listed as intentionally invalid',
  `E options/SKILL.md:13  ${option('notAnOptionA')}`,
  `E options/SKILL.md:15  ${option('notAnOptionB')}`,
  `E options/SKILL.md:16  ${option('notAnOptionC')}`,
  `E options/SKILL.md:17  ${event('notAnEventX')}`,
  `E options/SKILL.md:21  ${option('notAnOptionD')}`,
  `E options/SKILL.md:25  ${option('notAnOptionE')}`,
  `E options/SKILL.md:29  "aiAssistAutoComplete" is not an option or identifier in ${V}`,
]);

// 7. hard-coded versions (validate:skip and placeholders allowed)
expectExactly('versions: CDN, cdnjs, npm ranges, package.json', skills('versions'), pre('versions'), [
  `E versions/SKILL.md:11  ${hardcoded('froala-editor@5.5.0')}`,
  `E versions/SKILL.md:12  ${hardcoded('ajax/libs/froala-editor/5.5.0/')}`,
  `E versions/SKILL.md:13  ${hardcoded('froala-editor@^5.5.0')}`,
  `E versions/SKILL.md:13  ${hardcoded('froala-editor@~5.5.0')}`,
  `E versions/SKILL.md:13  ${hardcoded('froala-editor@latest')}`,
  `E versions/SKILL.md:16  ${hardcoded('"froala-editor": "5.5.0"')}`,
]);

// 15. js/javascript/mjs/cjs/json code blocks must parse (fragments, JSX, TypeScript and validate:skip are exempt)
const parseError = (m) => `Code block does not parse as JavaScript: ${m}. Fix it, or mark an intentional fragment with \`\`\`js fragment`;
expectExactly('parse: every JavaScript and JSON code block parses', skills('parse'), pre('parse'), [
  `E parse/SKILL.md:16  ${parseError("Unexpected identifier 'toolbarInline'")}`,
  `E parse/SKILL.md:50  ${parseError("Identifier 'FroalaEditor' has already been declared")}`,
  `E parse/SKILL.md:70  ${parseError("Unexpected token ';'")}`,
  'E parse/SKILL.md:76  JSON code block does not parse: Expected double-quoted property name in JSON at position 30. Fix it, or mark an intentional fragment with ```json fragment',
]);

test('generated files: stale check-froala.mjs copies are errors, --write regenerates them', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'froala-gen-'));
  try {
    const dir = path.join(tmp, 'froala-upgrade');
    fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), fs.readFileSync(path.join(FIX, 'parse', 'skills', 'parse', 'SKILL.md'), 'utf8').replace('name: parse', 'name: froala-upgrade').replace(/\nA missing comma[\s\S]*$/, '\nBody.\n'));
    fs.writeFileSync(path.join(dir, 'scripts', 'check-froala.mjs'), '// stale\n');
    const stale = run(['--skills-dir', tmp, '--allowlist', ALLOWLIST]);
    assert.equal(stale.status, 1, stale.out);
    assert.deepEqual(findings(stale.out, /\S*froala-gen-[^/]+\//), [
      'E froala-upgrade/references/plugin-names.md:1  Missing for froala-editor 5.6.0. Run: node scripts/validate-skills.mjs --froala 5.6.0 --write',
      'E froala-upgrade/scripts/check-froala.mjs:1  Out of date copy of scripts/check-froala.mjs. Run: node scripts/validate-skills.mjs --write',
    ]);
    const written = run(['--skills-dir', tmp, '--allowlist', ALLOWLIST, '--write']);
    assert.equal(written.status, 0, written.out);
    const copy = fs.readFileSync(path.join(dir, 'scripts', 'check-froala.mjs'), 'utf8');
    assert.equal(copy.split('\n')[1], '// GENERATED by scripts/validate-skills.mjs from scripts/check-froala.mjs. Do not edit; edit the source and run --write.');
    assert.equal(run(['--skills-dir', tmp, '--allowlist', ALLOWLIST]).status, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 9/10. frontmatter and line budget
expectExactly('frontmatter: name, description, triggers, metadata, license, line budget', skills('frontmatter'), pre('frontmatter'), [
  'W fm-desc-warn/SKILL.md:1  Description is 973 characters, close to the 1024 limit',
  'E Bad_Name/SKILL.md:1  Invalid name "Bad_Name" (lowercase letters, digits and single hyphens, at most 64 characters)',
  'E fm-bad-name/SKILL.md:1  name "fm-other-name" must match the folder "fm-bad-name"',
  'E fm-desc-long/SKILL.md:1  Description is 1038 characters (max 1024)',
  'E fm-long/SKILL.md:1  SKILL.md body is 501 lines (max 500); move detail into references/*.md',
  'E fm-missing/SKILL.md:1  Missing license',
  'E fm-missing/SKILL.md:1  metadata.version is missing',
  `E fm-triggers/SKILL.md:4  ${trigger('initPopup')}`,
  `E fm-triggers/SKILL.md:4  ${trigger('events.bind')}`,
  `E fm-triggers/SKILL.md:4  ${trigger('html.getMarkdown')}`,
  `E fm-triggers/SKILL.md:5  ${trigger('FroalaEditor.RegisterComand')}`,
  `E fm-triggers/SKILL.md:5  ${trigger('not_a_snake_api')}`,
]);

// 11. links stay inside the skill
expectExactly('links: relative links and references paths', skills('links'), pre('links'), [
  'E links/SKILL.md:11  Link "../other/SKILL.md" points outside the skill folder; skills are installed one by one, so copy what is needed into this skill',
  'E links/SKILL.md:12  Link "references/missing.md" does not resolve to a file in the skill',
  'E links/SKILL.md:14  "references/plugin-names.md" does not exist in skill "links" (only in "other"); skills are installed one by one, so add the file to this skill',
  'E links/SKILL.md:15  "skills/other/SKILL.md" points to another skill; skills are installed one by one, so reference a file inside this skill',
]);

// 13. UTM parameters
expectExactly('utm: docs links need the skill UTM parameters', skills('utm'), pre('utm'), [
  `E utm/SKILL.md:11  ${utm('https://froala.com/wysiwyg-editor/docs/options/#heightMin')}`,
  `E utm/SKILL.md:12  ${utm('https://froala.com/wysiwyg-editor/docs/events/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=other-skill')}`,
  `E utm/SKILL.md:14  ${utm('https://froala.com/wysiwyg-editor/docs/plugins/?ref=x')}`,
]);

test('utm: --fix-utm rewrites links in place, keeping anchors and other parameters', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'froala-utm-'));
  try {
    fs.cpSync(path.join(FIX, 'utm', 'skills'), tmp, { recursive: true });
    const fixed = run(['--skills-dir', tmp, '--allowlist', ALLOWLIST, '--fix-utm']);
    assert.equal(fixed.status, 0, fixed.out);
    assert.match(fixed.out, /--fix-utm: rewrote 3 docs link\(s\)/);
    const text = fs.readFileSync(path.join(tmp, 'utm', 'SKILL.md'), 'utf8');
    const q = 'utm_source=froala-skills&utm_medium=agent-skill&utm_content=utm';
    assert.ok(text.includes(`https://froala.com/wysiwyg-editor/docs/options/?${q}#heightMin)`), text);
    assert.ok(text.includes(`https://froala.com/wysiwyg-editor/docs/events/?${q})`), text);
    assert.ok(text.includes(`https://froala.com/wysiwyg-editor/docs/plugins/?ref=x&${q}.`), text);
    assert.ok(text.includes(`https://www.froala.com/wysiwyg-editor/docs/methods/?${q}#html.get)`), text);
    const again = run(['--skills-dir', tmp, '--allowlist', ALLOWLIST]);
    assert.equal(again.status, 0, again.out);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 14. per-category allowlist: an "external" name satisfies prose only
expectExactly('allowlist categories: external names do not pass option/button/plugin/event checks', skills('categories'), pre('categories'), [
  `E categories/SKILL.md:15  ${option('onlyExternal')}`,
  `E categories/SKILL.md:16  ${button('onlyExternal')}`,
  `E categories/SKILL.md:17  ${plugin('onlyExternal')}`,
  `E categories/SKILL.md:18  ${event('onlyExternal')}`,
]);

// 12. manifest, CHANGELOG and skill versions; skill lists
expectExactly('manifests: version sync and skill lists', ['--repo-root', path.join(FIX, 'manifests')], 'tests/fixtures/manifests/', [
  `E .claude-plugin/marketplace.json:1  ${mismatch('.claude-plugin/marketplace.json (plugin "froala")', '1.1.0')}`,
  `E skills/skill-b/SKILL.md:1  ${mismatch('skills/skill-b metadata.version', '1.1.0')}`,
  'E README.md  Skill "skill-b" is missing from the README skill list',
  'E README.md  the README skill list lists "skill-c", which is not a folder in skills/',
  'E skills.sh.json  Skill "skill-b" is missing from skills.sh.json groupings',
  'E .github/ISSUE_TEMPLATE/skill-feedback.yml  the skill-feedback issue template lists "skill-x", which is not a folder in skills/',
]);

// 14. robustness
test('GitHub annotations are escaped and printed once', () => {
  const r = run([...skills('annotations'), '--allowlist', ALLOWLIST], { GITHUB_ACTIONS: 'true' });
  assert.equal(r.status, 1, r.out);
  const lines = r.out.split('\n').filter((l) => l.includes('50%25off'));
  assert.deepEqual(lines, [`::error file=tests/fixtures/annotations/skills/annotations/SKILL.md,line=12::Event "50%25off" does not exist in ${V}`]);
  assert.ok(!/^ERROR /m.test(r.out), r.out);
});

test('--skills-dir without a value fails cleanly', () => {
  const r = run(['--skills-dir']);
  assert.equal(r.status, 2);
  assert.equal(r.out.trim(), 'ERROR    --skills-dir needs a value');
});

test('unknown arguments and allowlist categories fail cleanly', () => {
  const a = run(['--nope']);
  assert.equal(a.status, 2);
  assert.equal(a.out.trim(), 'ERROR    Unknown argument "--nope"');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'froala-allow-'));
  try {
    const bad = path.join(tmp, 'allow.json');
    fs.writeFileSync(bad, JSON.stringify({ wrongCategory: [{ name: 'x', reason: 'y' }] }));
    const b = run([...skills('positive'), '--allowlist', bad]);
    assert.equal(b.status, 2);
    assert.match(b.out, /Unknown allowlist category "wrongCategory"/);
    assert.ok(!/\n\s+at /.test(b.out), 'no stack trace');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
