---
type: llm
---

PASS if the answer explains that with no upload target configured Froala inserts temporary `blob:` URLs that only live in the current page, and fixes it by configuring an upload target (`imageUploadURL` with a server returning `{ "link": "..." }`, or S3/Filestack), noting existing saved content has dead images.
FAIL if it says images are stored inline as base64 by default, or blames CSS, CORS or the database.
