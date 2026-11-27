---
type: llm
---

PASS if the answer explains that Froala appends content popups to `scrollableContainer` (`'body'` by default), so they end up behind the modal or outside Bootstrap's focus trap, and fixes it by setting `scrollableContainer` to an element inside the modal that scrolls and is positioned (for example `'#myModal .modal-body'`). Mentioning `zIndex` together with turning off the modal's focus trap (`data-bs-focus="false"`) as a second option is fine.
FAIL if the only fix is raising `zIndex` or CSS `z-index` (the focus trap still steals typing), or if it uses an option that does not exist in Froala (such as `popupContainer` or `appendTo`).
