---
type: llm
---

PASS if the answer configures `imageUploadToS3` (optionally `fileUploadToS3` / `videoUploadToS3`) with an object fetched from a backend endpoint, and the backend computes the signed POST policy (for example `S3.getHash` from wysiwyg-editor-node-sdk, or an equivalent AWS Signature V4 policy signer) from environment variables, so the AWS secret key never appears in browser code. It should mention that the signature expires (compute it per request or refresh it) and that the bucket needs CORS for the page's origin.
FAIL if the secret key or access key pair is placed in frontend code or in the editor options, if it invents an option name (such as `s3Upload`, `imageUploadS3` or `awsConfig`), or if it routes the file through the backend while claiming it is a direct upload.
