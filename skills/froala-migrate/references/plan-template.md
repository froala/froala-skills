# Migration plan template

Write this file as `FROALA_MIGRATION_PLAN.md` in the project root. Keep it factual: what the project
uses today and what it will use with Froala. No opinions about either product.

```markdown
# Migration plan: <Editor> <version> → Froala <version>

## Summary
- Framework / wrapper: …
- Stored content format: HTML | Markdown | JSON (…)
- Pages/components using the editor: …
- Approach: Froala built next to the existing editor behind <flag/route>; old editor unchanged.

## Feature mapping
| Feature used today | Froala | Status |
|---|---|---|
| … | … | Mapped / Mapped with differences / Custom plugin |

## Custom work
Features the project uses that will be built as Froala custom plugins or commands (`froala-custom-plugins`): what each does today, who uses it, and how it will be built. Content these features produce is kept unchanged.

## Mapped with differences
For each item: what changes for users or developers.

## Uploads
Current endpoint and response → Froala `imageUploadURL` and `{ "link": … }` response.

## Content conversion
Source format → HTML steps, script location, sample set, how results are compared, rollback.

## Licences and accounts
Which features need a paid plan (Froala or the current editor). The user confirms their own agreements.

## Verification
Build, browser check, upload check, sample content comparison.

## Open questions for the user
…
```
