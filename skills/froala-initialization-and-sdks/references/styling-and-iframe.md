# Styling, themes and iframe mode

Part of the froala-initialization-and-sdks skill (verified against froala-editor 5.6.0). Defaults are quoted from `FroalaEditor.DEFAULTS` in the 5.6.0 package. Every behaviour described here was reproduced in headless Chromium against the npm package; where something was not reproduced, this file says so.

## Contents

- Themes
- Editor size: `height`, `heightMin`, `heightMax`
- Stacking: `zIndex`
- Iframe mode: `iframe`, `iframeStyle`, `iframeStyleFiles`, `iframeDefaultStyle`
- Full HTML documents: `fullPage`
- Displaying saved content: `fr-view` and `froala_style.min.css`
- CSS resets and frameworks (Tailwind preflight)

---

## Themes

| Option | Default | Notes |
|---|---|---|
| `theme` | `null` | `'dark'`, `'gray'` or `'royal'` in 5.6.0 (the files in `css/themes/`) |

```js
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/themes/dark.min.css'; // CDN: …/froala-editor@VERSION/css/themes/dark.min.css

new FroalaEditor('#editor', { theme: 'dark' });
```

- The option only adds the class `dark-theme` (`<name>-theme`) to the `.fr-box` element. The colours come from the theme stylesheet. Without it, nothing changes: with `theme: 'dark'` and no `dark.min.css`, the toolbar stayed white in the test.
- `theme` is read once at start. To switch themes on a running page, destroy and re-create the editor (see the main skill).
- A custom theme is your own CSS scoped to `.<name>-theme`, with `theme: '<name>'`. Copy `css/themes/gray.css` (the unminified file) as a starting point.

## Editor size: `height`, `heightMin`, `heightMax`

All three default to `null` (the editor grows with its content). Values are in pixels.

| Option | Observed effect |
|---|---|
| `height: 250` | Fixed height. The scrolling wrapper (`.fr-wrapper`) gets `height: 250px` and the content scrolls inside it |
| `heightMin: 150` | The editing area (`.fr-element`) gets `min-height: 150px`; the editor still grows with content |
| `heightMax: 300` | The wrapper gets `max-height: 300px` and `overflow: auto`: the editor grows up to 300px, then scrolls |

Combine `heightMin` and `heightMax` for an editor that starts small and stops growing. To change the size of a running editor, set the option and refresh: `editor.opts.height = 400; editor.size.refresh();` (reproduced: the wrapper went from `200px` to `400px`).

## Stacking: `zIndex`

| Option | Default |
|---|---|
| `zIndex` | `1` |

With `zIndex: 2001`, the editor box (`.fr-box`) got `z-index: 2001` and the toolbar `2002`. Raise it when a sticky header, a modal or another positioned element covers the toolbar, dropdowns or popups. Inside a modal, set it above the modal's own `z-index`.

## Iframe mode

By default the editor's content is a `contenteditable` `<div>` in your page, so every page stylesheet applies to it. With `iframe: true` the content lives in an `<iframe>`: page CSS no longer reaches it, and you choose exactly which CSS the content gets.

| Option | Default | What it does |
|---|---|---|
| `iframe` | `false` | Put the editable content in an iframe (`iframe.fr-iframe`) |
| `iframeStyleFiles` | `[]` | Stylesheet URLs added as `<link>` elements to the iframe's `<head>` |
| `iframeStyle` | `''` | CSS text added after `iframeDefaultStyle`, in the same `<style>` element |
| `iframeDefaultStyle` | Froala's base CSS for the iframe: `html{margin:0px;height:auto;}body{height:auto;padding:20px;background:transparent;color:#000000;…}` | Replace it only if you mean to drop that base CSS; add rules with `iframeStyle` instead |

```js
new FroalaEditor('#editor', {
  iframe: true,
  iframeStyleFiles: ['/css/content.css'],          // e.g. the same CSS your site uses to display articles
  iframeStyle: 'body { font-family: Georgia, serif; }',
});
```

Observed in 5.6.0:

- The file in `iframeStyleFiles` was requested and linked in the iframe `<head>`, and its rules applied to the content. Use absolute or root-relative URLs.
- `iframeStyle` applied (the body font changed) on top of the default style.
- `editor.el` is the iframe's `<body>` and `editor.doc` is the iframe document. Query content with `editor.el` / `editor.doc`, not `document`.
- `html.get()`, `html.set()` and events work the same as without the iframe.
- `froala_editor.pkgd.min.css` is still needed on the page for the toolbar and popups.

## Full HTML documents: `fullPage`

| Option | Default |
|---|---|
| `fullPage` | `false` |

Use `fullPage: true` to edit a whole HTML document (an email template, a landing page) including `<!DOCTYPE>`, `<html>`, `<head>` and `<body>` attributes.

```js
new FroalaEditor('#editor', {
  fullPage: true,
  htmlRemoveTags: ['script'], // default ['script', 'style'] would delete the <style> blocks in <head>
  events: {
    initialized() {
      this.html.set('<!DOCTYPE html><html><head><title>Newsletter</title><style>p{color:#333}</style></head><body><p>Hi</p></body></html>');
    },
  },
});
```

Observed in 5.6.0:

- `fullPage: true` turns iframe mode on (`editor.opts.iframe` became `true`).
- `html.get()` returns the full document: `<!DOCTYPE html><html><head><title>…</title>…</head><body …>…</body></html>`. `<title>`, `<meta>` and attributes on `<body>` were kept.
- With the default `htmlRemoveTags`, the `<style>` element in `<head>` was **removed**. With `htmlRemoveTags: ['script']` it was kept and its rules applied to the content. Only do this for trusted templates; sanitise on the server either way.
- **With no key or the trial key, the 5.6.0 "Powered by Froala Editor" paragraph (`<p data-f-id="pbf">…</p>`) is appended after `</html>`**, which makes the saved document invalid. Set your licence key before saving full documents.

## Displaying saved content: `fr-view` and `froala_style.min.css`

The editor's own content styles (image alignment classes, table styles, paragraph and link styles) live in `css/froala_style.min.css` and only apply inside an element with the class `fr-view`. The editing area itself has the `fr-view` class, which is why content looks right while editing and wrong on a page that only prints the HTML.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/froala-editor@VERSION/css/froala_style.min.css">

<div class="fr-view">
  <!-- saved HTML, sanitised on the server -->
</div>
```

Observed: an image saved with `class="fr-dib fr-fil"` (block, aligned left) displayed as `display: block` inside `.fr-view` with the stylesheet, and as a plain inline image outside it. A table with the `fr-alternate-rows` style only got its shaded rows inside `.fr-view`.

- Load the stylesheet with the same version as the editor.
- Don't load `froala_editor.pkgd.min.css` on display-only pages; it is for the editor UI.
- In iframe mode or with `fullPage`, `froala_style.min.css` is not inside the iframe unless you add it to `iframeStyleFiles`.

## CSS resets and frameworks (Tailwind preflight)

Without the iframe, global CSS resets reach the editing area. Tailwind's preflight (`tailwindcss/preflight.css` 4.x, also part of `@import "tailwindcss"`) was loaded with the editor in a test page. In the editing area it removed list bullets and numbering (`list-style: none`, `padding-left: 0`), set `h1`/`h2` to the body font size and normal weight, and removed paragraph margins. Bulleted and numbered list buttons then appear to "do nothing" even though the HTML has `<ul>`/`<ol>`.

Two fixes, both reproduced:

1. **Restore the styles under `.fr-view`** (applies to the editing area and to pages that display content):

   ```css
   .fr-view ul { list-style-type: disc; padding-left: 40px; }
   .fr-view ol { list-style-type: decimal; padding-left: 40px; }
   /* add headings, paragraph margins, blockquote… as your design needs */
   ```

   With Tailwind 4 you can put these in `@layer base` after the import. The Typography plugin's `prose` class is an alternative for display pages; it was not tested with the editor.

2. **Use `iframe: true`**, so the page's reset never reaches the content. With preflight on the page, lists in the iframe kept their bullets and `40px` padding. Add your content CSS with `iframeStyleFiles`.

Other CSS frameworks with global element resets (Bootstrap's Reboot, CSS normalisers) can cause similar differences; they were not tested here. Check computed styles inside `.fr-element` when content looks different in the editor than on the page.
