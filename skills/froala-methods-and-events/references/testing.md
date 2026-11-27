# End-to-end testing an app that embeds Froala

Part of the froala-methods-and-events skill (verified against froala-editor 5.6.0). The Playwright and Cypress specs below were run against a page that loads the 5.6.0 npm package: Playwright 1.65.1 (Chromium, 3 tests passed) and Cypress 16.3.0 (Electron, 2 tests passed).

## Contents

- What to know first
- The test hook in the app
- Playwright
- Cypress
- Unit tests in jsdom (Jest, Vitest)

---

## What to know first

- **Use a real browser.** Froala needs real layout and selection. In jsdom (29.1.1 and 31.0.1, tested directly) 5.6.0 never initialized: its deferred setup threw `TypeError: Cannot read properties of undefined (reading 'split')`, `initialized` never fired and `editor.html` stayed `undefined`.
- **Wait for `initialized`.** The constructor returns at once and builds the editor asynchronously; `editor.html` doesn't exist until `initialized`. Wait for a signal the app sets in that event, not for a fixed timeout.
- **The editable area is `.fr-element`** (a `contenteditable` element; in iframe mode it is the iframe's `<body>`, see froala-initialization-and-sdks). Toolbar buttons are `.fr-toolbar button[data-cmd="<command>"]`.
- **`FroalaEditor` is only a global when the editor is loaded with a `<script>` tag.** The package is UMD: under Vite, webpack or another bundler it is a module export, so `window.FroalaEditor` (and `FroalaEditor.INSTANCES`) don't exist in the test page. Expose the instance yourself (next section).
- **The "Powered by" paragraph.** With no licence key or the trial key, 5.6.0 `html.get()` ends with `<p data-f-id="pbf">Powered by <a …>Froala Editor</a></p>`. Remove it before comparing HTML, or load a key that is valid for the test host.
- **Content changed from code** (`html.set()`, `html.insert()`) does not fire `contentChanged`: if a test drives the API, call `editor.undo.saveStep()` afterwards, as the app must (see the main skill).

## The test hook in the app

Set a ready flag and, in test builds, expose the instance from `initialized`:

```js
new FroalaEditor('#editor', {
  imageUploadURL: '/upload',
  events: {
    initialized() {
      window.__editor = this;                                   // test hook (guard it for test builds)
      document.getElementById('editor').dataset.ready = 'true';
    },
  },
});
```

In React, Vue, Angular and Svelte, do the same in the wrapper's `config.events.initialized` (or set the flag from the component once you have the editor).

## Playwright

```js
// tests/editor.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');

// Drop the "Powered by Froala Editor" paragraph 5.6.0 appends without a licence key
const withoutPoweredBy = (html) => html.replace(/<p data-f-id="pbf"[\s\S]*?<\/p>/, '');
const editorHtml = async (page) => withoutPoweredBy(await page.evaluate(() => window.__editor.html.get()));

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#editor[data-ready="true"]')).toBeVisible(); // set in events.initialized
});

test('typing updates the content', async ({ page }) => {
  await page.locator('.fr-element').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Hello from Playwright');
  await expect.poll(() => editorHtml(page)).toBe('<p>Hello from Playwright</p>');
});

test('toolbar command applies formatting', async ({ page }) => {
  await page.locator('.fr-element p').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.locator('.fr-toolbar button[data-cmd="bold"]').click();
  await expect.poll(() => editorHtml(page)).toBe('<p><strong>Initial</strong></p>');
});

test('image upload inserts the returned link', async ({ page }) => {
  await page.locator('.fr-element p').click();
  await page.locator('.fr-toolbar button[data-cmd="insertImage"]').click();
  await page.locator('.fr-popup.fr-active input[type="file"]')
    .setInputFiles(path.join(__dirname, 'fixtures/photo.jpg'));
  // The server answered {"link": "/uploads/photo.jpg"}
  await expect(page.locator('.fr-element img[src="/uploads/photo.jpg"]')).toBeVisible();
});
```

The page under test had the editor on `<div id="editor"><p>Initial</p></div>` with `toolbarButtons: ['bold', 'insertImage']`. Notes from the run:

- `locator('.fr-element').fill('text')` also worked: the content became `<p>text</p>` and `contentChanged` fired once. Typing fired `contentChanged` as well.
- The file input belongs to the Insert Image popup, which exists only after the `insertImage` button is clicked. Target the active popup, as above.
- Playwright's expect.poll retries the read until it matches, so the assertion doesn't depend on timing. (In the run, reading `html.get()` straight after typing already returned the typed text.)
- For upload tests without a backend, add `await page.route('**/upload', (r) => r.fulfill({ json: { link: '/uploads/photo.jpg' } }));` in the beforeEach hook, before the page loads (used in the run). The response must be `{"link": …}`; anything else fires `image.error`.

## Cypress

```js
// cypress/e2e/editor.cy.js
const withoutPoweredBy = (html) => html.replace(/<p data-f-id="pbf"[\s\S]*?<\/p>/, '');
const editorHtml = () => cy.window().then((win) => withoutPoweredBy(win.__editor.html.get()));

describe('Froala editor', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('#editor[data-ready="true"]'); // set in events.initialized
  });

  it('typing updates the content', () => {
    cy.get('.fr-element').click().type('{selectall}Hello from Cypress');
    editorHtml().should('eq', '<p>Hello from Cypress</p>');
  });

  it('image upload inserts the returned link', () => {
    cy.get('.fr-element p').click();
    cy.get('.fr-toolbar button[data-cmd="insertImage"]').click();
    cy.get('.fr-popup.fr-active input[type="file"]')
      .selectFile('cypress/fixtures/photo.jpg');
    cy.get('.fr-element img[src="/uploads/photo.jpg"]').should('be.visible');
  });
});
```

To run without a backend, stub the upload in the beforeEach hook with `cy.intercept('POST', '/upload', { link: '/uploads/photo.jpg' })` (used in the run). Cypress 16 warns that Electron is deprecated as a test browser; run with `--browser chrome` where Chrome is installed.

## Unit tests in jsdom (Jest, Vitest)

Froala 5.6.0 did not initialize in jsdom (see above), so don't unit-test editor behaviour there. In component unit tests, mock the wrapper (for example with Jest's module mocking, returning a `<textarea>` that calls `onModelChange`), test your own logic, and cover the editor itself with Playwright or Cypress. The mock approach is a general testing pattern, not something reproduced for this file.
