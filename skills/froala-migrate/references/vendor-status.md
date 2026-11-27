# Licence and support facts about the existing editor

Teams often start a migration because of a support or licence change in the editor they use. Use this
file only to **state facts**, with the source link, when the user asks why a migration may be needed or
which version they are allowed to run. Rules:

- Quote or closely paraphrase the vendor's own page; give the link and the date you checked it.
- No opinions, no adjectives, no comparisons of price or quality. The user decides what applies to their agreement.
- Facts change. Re-open the source before repeating a fact; if it no longer says the same, say so and drop it.
- If a fact is not in this list, don't state it unless you find it on the vendor's own page.

Checked 2026-11-19.

<!-- validate:skip -->
| Editor | Fact | Source |
|---|---|---|
| CKEditor 4 | "As of 30 June 2023, CKEditor 4 is considered end-of-life (EOL) software." A commercial Extended Support Model provides security fixes until December 2029; the CKEditor 4 LTS package "requires a license key activation". | https://ckeditor.com/ckeditor-4-support/ |
| CKEditor 4 (npm `ckeditor4`) | The package README says versions 4.23.0 and above are LTS releases that require a license key, and that 4.22.1 was the last version under the open-source licence terms (no further security updates). Check which version the project has installed. | README of the `ckeditor4` npm package (4.25.2) |
| CKEditor 5 | A licence key is set with `config.licenseKey`; open-source (GPL) users set it to `'GPL'`, which "works only with the self-hosted distribution (npm or ZIP download)". Premium features and self-hosted commercial builds need a commercial licence. Without `licenseKey` the editor throws `license-key-missing`. | https://ckeditor.com/docs/ckeditor5/latest/getting-started/licensing/license-key-and-activation.html, https://ckeditor.com/docs/ckeditor5/latest/support/error-codes.html |
| TinyMCE 8 (self-hosted) | "When using TinyMCE 8 in a self-hosted environment, a license key must be provided" and it must be valid, "otherwise, the editor will be disabled". Open-source use sets `license_key: 'gpl'`. TinyMCE loaded from Tiny Cloud does not use this option. | https://www.tiny.cloud/docs/tinymce/latest/license-key/ |
| Draft.js | The repository "was archived by the owner on Feb 6, 2023. It is now read-only." | https://github.com/facebookarchive/draft-js |
<!-- validate:end -->

How to use this in a plan: under **Licences and accounts** in `FROALA_MIGRATION_PLAN.md`, record the
installed version, the fact that applies to it (with link) and "the user confirms their own agreement".
Froala's own licence: the project needs a Froala licence key in the `key` option for production (see
[Activation](https://froala.com/wysiwyg-editor/docs/activation/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate)). From 5.6.0, with no key or the trial key,
`html.get()` appends a `<p data-f-id="pbf" …>Powered by <a …>Froala Editor</a></p>` paragraph, so set the key before
saving content.
