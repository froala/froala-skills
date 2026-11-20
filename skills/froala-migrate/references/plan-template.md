# Migration plan template

Write this file as `FROALA_MIGRATION_PLAN.md` in the project root. Keep it factual: what the project
uses today and what it will use with Froala. No opinions about either product.

```markdown
# Migration plan: <Editor> <version> → Froala <version>

## Summary
- Framework / wrapper: … → Froala wrapper: …
- Stored content format: HTML | Markdown | JSON (…) — saved through: <getter, e.g. getSemanticHTML()>
- Pages/components using the editor: …
- Approach: Froala built next to the existing editor behind <flag/route>; old editor unchanged.

## Feature mapping
| Feature used today | Froala | Status |
|---|---|---|
| … | … | Mapped / Mapped with differences / Custom work / No equivalent (agreed workaround) |

## Custom work
Features the project uses that will be built as Froala custom plugins or commands ([Custom plugin](https://froala.com/wysiwyg-editor/docs/concepts/custom/plugin/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate), [Custom button](https://froala.com/wysiwyg-editor/docs/concepts/custom/button/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-migrate)): what each does today, who uses it, and how it will be built. Content these features produce is kept unchanged.

## Mapped with differences
For each item: what changes for users or developers.

## No equivalent
Features with no Froala plugin or option. For each: who uses it, the workaround (custom plugin, keep the stored markup, server-side step, drop), and the user's decision.

## Uploads
Current endpoint, form field and response → Froala `imageUploadURL`, `imageUploadParam` and `{ "link": … }` response. Auth headers / cookies (`requestHeaders`, `requestWithCredentials`).

## Content conversion
Source format → HTML steps, script location, sample set, post-processing rules, how results are compared (round trip, counts, screenshots), where converted copies are stored, rollback.

## Display pages and other channels
Pages, emails, PDFs, mobile apps or search indexing that render stored content; CSS changes (`fr-view`, `froala_style.min.css`).

## Licences and accounts
Which features need a paid plan (Froala or the current editor). Support or licence facts about the current version, with source links (`references/vendor-status.md`). The user confirms their own agreements.

## Rollout
1. Side by side: Froala behind <flag/route> for internal users; old editor still the default.
2. Content check: sample documents opened in both editors; differences listed and accepted.
3. Pilot: <group> edits with Froala; saved HTML checked (no `blob:` URLs, no lost markup, server sanitizer keeps `fr-*` classes).
4. Default switch: Froala for everyone; old editor still installed and reachable for rollback.
5. Clean-up (only when the user asks): remove the old editor, its packages, CSS and converted-format code.

Rollback: how to switch the flag back, and which documents were saved by Froala meanwhile (they stay valid HTML; JSON-based apps need the reverse path or must keep HTML).

## Verification
Build and type-check; browser check of every mapped button; upload check; content comparison; form submit; display pages.

## Open questions for the user
…
```
