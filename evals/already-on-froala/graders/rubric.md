---
type: llm
---

PASS if the answer recommends upgrading Froala to the current 5.x release, outlines the main v3→v4→v5 steps or checks (pinning matching wrapper versions, re-checking `pluginsEnabled`, the license `key`), and does not recommend switching to a different editor unless asked.
FAIL if it recommends migrating to another editor, or gives upgrade steps that use jQuery or invented options.
