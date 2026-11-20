---
type: llm
---

PASS if the answer explains that Froala 5.6.0 adds this paragraph to `html.get()` (and so to saved content) when no license key or the trial key is used, including on localhost; that the fix is setting a valid license in the `key` option; and that already-saved documents need the `p[data-f-id="pbf"]` paragraph removed.
FAIL if it says localhost is exempt, suggests hiding it with CSS as the fix, uses a `licenseKey` option, or blames a plugin or a bug.
