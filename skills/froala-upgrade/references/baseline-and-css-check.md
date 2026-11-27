# Baseline before upgrading, and the custom CSS check

Part of the froala-upgrade skill (verified against froala-editor 5.6.0). Both scripts below were run on 2026-11-25 against pages built with froala-editor 4.5.2 and 5.6.0 (Node 24, Playwright 1.65, Chromium).

## Contents

- Record a baseline (before the upgrade)
- Compare with the baseline (after the upgrade)
- Check the project's custom `.fr-*` CSS
- Without a browser tool

## Record a baseline (before the upgrade)

Do this on the **old** version, before touching `package.json` or any CDN URL. Pick a page that shows the editor with a representative document: headings, a table, a list, an image, a link, and any custom buttons or plugins.

If the project's editor is created through a bundler (React, Vue, Angular, Svelte, or `import FroalaEditor from 'froala-editor'`), there is no `window.FroalaEditor`. For the baseline run only, add `window.__froalaEditor = this;` inside `events.initialized`, and remove it again after the comparison. With CDN `<script>` builds the script uses `FroalaEditor.INSTANCES[0]` (declared in `index.d.ts`).

Save as `froala-baseline.mjs` in a scratch folder with Playwright installed (`npm i -D playwright && npx playwright install chromium`):

```js
// Records a Froala baseline: screenshot, html.get() of the loaded document, toolbar buttons, console errors.
// usage: node froala-baseline.mjs <page URL> <out dir>
import { chromium } from 'playwright';
import fs from 'node:fs';

const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url);
await page.waitForSelector('.fr-toolbar .fr-btn');
await page.waitForTimeout(500);
const data = await page.evaluate(() => {
  // CDN builds define window.FroalaEditor; in bundled apps set window.__froalaEditor = this in events.initialized
  const editor = window.__froalaEditor || (window.FroalaEditor && window.FroalaEditor.INSTANCES[0]);
  return {
    version: window.FroalaEditor ? window.FroalaEditor.VERSION : null,
    buttons: [...new Set([...document.querySelectorAll('.fr-toolbar .fr-btn[data-cmd]')].map((b) => b.dataset.cmd))],
    html: editor ? editor.html.get() : null,
  };
});
data.consoleErrors = errors;
fs.writeFileSync(`${out}/baseline.json`, JSON.stringify(data, null, 2));
await page.locator('.fr-box').first().screenshot({ path: `${out}/editor.png` });
await browser.close();
console.log(`${out}: Froala ${data.version}, ${data.buttons.length} buttons, html ${data.html === null ? 'not read' : data.html.length + ' chars'}`);
```

```bash
node froala-baseline.mjs http://localhost:5173/editor-page baseline/before
```

Load the page over `http://` or `https://`, not `file://`: in a 5.6.0 test with no key, `html.get()` included `<p data-f-id="pbf">` over HTTP but not from a `file://` URL, so a `file://` baseline hides the licence paragraph. `version` is `null` in bundled apps; record the version from `node_modules/froala-editor/package.json` instead. `buttons` includes the buttons hidden inside the toolbar's "more" groups. If a login is needed to reach the page, ask the user for a test page or a URL that needs none; never ask for or store their password in the script.

## Compare with the baseline (after the upgrade)

Run the same command against the upgraded app into `baseline/after`, then, from the `baseline` folder:

```bash
node -e '
const [a, b] = ["before", "after"].map((d) => require(`./${d}/baseline.json`));
console.log("version:", a.version, "->", b.version);
console.log("buttons gone:", a.buttons.filter((x) => !b.buttons.includes(x)));
console.log("buttons new:", b.buttons.filter((x) => !a.buttons.includes(x)));
console.log("html identical:", a.html === b.html);
if (a.html !== b.html) { console.log("before:", a.html); console.log("after: ", b.html); }
console.log("console errors after:", b.consoleErrors);
'
```

Then look at `before/editor.png` and `after/editor.png` side by side (open both images; a browser tool can read them).

How to read the result:

- **Buttons gone:** a plugin is no longer loaded, `pluginsEnabled` misses a new plugin name, or a custom command did not register. See the plugin table in `plugin-names.md`.
- **Buttons new:** expected when the app uses the default toolbar. A 4.5.2 → 5.6.0 run with the default toolbar added 20 buttons, including `aiAssist`, `aiChatAssistant`, `collabPanel`, `import_from_word`, `export_to_word`, `paintFormat`, `codeSnippet` and `accessibilityChecker`. Set `toolbarButtons` if the user wants the old toolbar.
- **HTML differs:** decide with the user, as in the round-trip check (step 7 of the workflow). `<p data-f-id="pbf">` in `after` means the licence key is missing.
- **Screenshot differs:** check the custom CSS (next section) before blaming Froala.

## Check the project's custom `.fr-*` CSS

Projects often restyle Froala with selectors such as `.fr-toolbar .fr-btn` or `.fr-popup .fr-table-selector`. If a class no longer exists in the new version, the rule silently stops matching. This script lists every `.fr-*` class used in the project's stylesheets (`.css`, `.scss`, `.sass`, `.less`, and `.vue` / `.svelte` files) that the new version's CSS files no longer define. It skips `node_modules` and dot-folders.

Save as `froala-css-check.mjs`:

```js
// Lists the .fr-* classes your stylesheets use that the new Froala version's CSS no longer defines.
// usage: node froala-css-check.mjs <old froala-editor dir> <new froala-editor dir> <your src dir>
import fs from 'node:fs';
import path from 'node:path';

const walk = (dir, exts) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === 'node_modules' || e.name.startsWith('.') ? [] : walk(p, exts);
  return exts.some((x) => e.name.endsWith(x)) ? [p] : [];
});
const classesIn = (files) => {
  const found = new Map();
  for (const f of files) for (const c of fs.readFileSync(f, 'utf8').match(/\.fr-[\w-]+/g) || []) {
    if (!found.has(c)) found.set(c, new Set());
    found.get(c).add(f);
  }
  return found;
};

const [oldDir, newDir, srcDir] = process.argv.slice(2);
const oldCss = classesIn(walk(path.join(oldDir, 'css'), ['.css']));
const newCss = classesIn(walk(path.join(newDir, 'css'), ['.css']));
const yours = classesIn(walk(srcDir, ['.css', '.scss', '.sass', '.less', '.vue', '.svelte']));

console.log(`Froala CSS classes: ${oldCss.size} old, ${newCss.size} new; removed: ${[...oldCss.keys()].filter((c) => !newCss.has(c)).length}`);
const missing = [...yours.keys()].filter((c) => !newCss.has(c)).sort();
for (const c of missing) {
  console.log(`${c}  ${oldCss.has(c) ? 'removed in the new version' : 'not in either version'}  <- ${[...yours.get(c)].join(', ')}`);
}
if (!missing.length) console.log(`All ${yours.size} .fr-* classes in your stylesheets still exist in the new version.`);
```

Run it **before** upgrading, from the project root, with the target version unpacked next to the installed one (replace `VERSION` with the target version):

```bash
mkdir -p .froala-check
npm pack froala-editor@VERSION --pack-destination .froala-check
tar -xzf .froala-check/froala-editor-VERSION.tgz -C .froala-check
node froala-css-check.mjs node_modules/froala-editor .froala-check/package .
```

Example output for a project moving from 4.5.2 to 5.6.0:

```text
Froala CSS classes: 322 old, 854 new; removed: 9
.fr-table-selector  removed in the new version  <- src/editor.css
```

Between 4.5.2 and 5.6.0 the removed classes are `.fr-advanced-options`, `.fr-checkbox-item`, `.fr-checkbox-label`, `.fr-table-selector`, `.fr-table-selector-active`, `.fr-table-selector-active-selected`, `.fr-table-selector-inactive`, `.fr-table-selection-hover` and `.fr-table-selected`.

For each class reported as removed, find what replaced it in the new version (inspect the element in the upgraded editor) and update the rule. "Not in either version" usually means a typo, or a class the project adds itself. The script checks class names only: a rule whose classes all still exist can still stop matching if the DOM structure changed, so also compare the screenshots. Delete `.froala-check` afterwards, and don't commit it.

## Without a browser tool

Ask the user to record, on the old version:

1. A screenshot of the editor with a representative document loaded.
2. The output of `editor.html.get()` for that document (from `events.initialized`, or `FroalaEditor.INSTANCES[0].html.get()` in the console of a CDN build), saved to a file.
3. The list of toolbar buttons they use, including the ones inside the "more" menus.

After the upgrade, ask them to repeat the three and compare. The CSS check above needs only Node, so run it yourself.
