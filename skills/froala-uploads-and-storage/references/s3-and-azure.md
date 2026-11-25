# Direct uploads to Amazon S3 and Azure Blob Storage

Part of the froala-uploads-and-storage skill. Option shapes are read from `froala-editor` 5.6.0 (`js/plugins/image.min.js`, `file.min.js`, `video.min.js`). The browser requests below were captured in headless Chromium with the network intercepted. **No real AWS or Azure account was used**: the request shapes and the signature algorithm are verified; acceptance by S3 and Azure is not. Test against a real bucket or container before release.

## Contents

- S3: how the editor uploads
- S3: signing on the server
- S3: bucket setup
- Azure: how the editor uploads
- Azure: a SAS from the server

## S3: how the editor uploads

`imageUploadToS3` (and `fileUploadToS3`, `videoUploadToS3`) is an object:

| Key | Use |
|---|---|
| `bucket`, `region` | The POST goes to `https://<region>.amazonaws.com/<bucket>`, so `region` must be the host prefix (`s3`, `s3-eu-west-1`, `s3.eu-west-1`), not a bare region name |
| `uploadURL` | Used instead of `bucket` + `region` when set, for example `https://my-bucket.s3.eu-west-1.amazonaws.com` |
| `keyStart` | Prefix of the object key |
| `params` | Form fields added to the POST: the signed policy and signature fields, and `acl` if the policy has one |

The editor sends a `multipart/form-data` POST with, in order: `key` = `keyStart + Date.now() + '-' + <user's file name>`, `success_action_status` = `201`, `X-Requested-With` = `xhr`, `Content-Type` = the file's type, every `params` field, `imageUploadParams` fields, and the file in the `imageUploadParam` field. **Headers from `requestHeaders` are sent to S3 too**, which forces a CORS preflight and leaks tokens meant for your API.

S3 must answer **201** with its XML body. The editor reads `<Location>` and `<Key>`, fires `image.uploadedToS3(link, key, response)` (return `false` to cancel the insert), and inserts `<Location>` as the `src`. Any other status fires `image.error` code 4. The object must be publicly readable (or served through CloudFront), or the inserted image will not load.

The editor reads these options at each upload, so you can replace `editor.opts.imageUploadToS3` at runtime with a fresh signature (tested).

## S3: signing on the server

**The AWS secret key stays on the server.** The browser only gets a policy that is valid for a few minutes and only for keys under `keyStart`.

Official SDKs (5.6.0): Node `S3.getHash(config)` (5-minute policy), Python `S3.getHash` (5 minutes), Java `S3.getHash(S3Config)` (5 minutes, same time-zone bug as .NET), .NET `S3.GetHash(S3Config)` (5 minutes, see the time-zone bug), PHP `S3::getHash` (10 hours, returns JSON text), Ruby `S3.data_hash` (10 hours). Node's returns:

```json
{
  "bucket": "my-bucket",
  "region": "s3-eu-west-1",
  "keyStart": "uploads/",
  "params": {
    "acl": "public-read",
    "policy": "<base64 policy>",
    "x-amz-algorithm": "AWS4-HMAC-SHA256",
    "x-amz-credential": "<access key>/20261125/eu-west-1/s3/aws4_request",
    "x-amz-date": "20261125T000000Z",
    "x-amz-signature": "<hex>"
  }
}
```

Its policy allows any size and any `Content-Type` under `keyStart`. The policy expires 5 minutes after `S3.getHash` runs, so **compute it per request** (as the docs' complete example does inside the route), never once at server start.

A Node signer that uses the same algorithm (with the same inputs it produced a byte-identical policy and signature to the SDK's `S3.getHash`), and adds a size limit, an optional `acl` and the regional `uploadURL`:

```js
// s3sign.js: same algorithm as wysiwyg-editor-node-sdk 5.6.0 lib/s3.js getHash, plus a size limit,
// an optional acl and the regional virtual-hosted upload URL.
const crypto = require('node:crypto');

function s3UploadConfig({ bucket, region, keyStart, acl, accessKey, secretKey, maxBytes }) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const credential = `${accessKey}/${date}/${region}/s3/aws4_request`;
  const amzDate = `${date}T000000Z`;
  const conditions = [
    { bucket },
    ...(acl ? [{ acl }] : []),
    { success_action_status: '201' },
    { 'x-requested-with': 'xhr' },
    { 'x-amz-algorithm': 'AWS4-HMAC-SHA256' },
    { 'x-amz-credential': credential },
    { 'x-amz-date': amzDate },
    ['starts-with', '$key', keyStart],
    ['starts-with', '$Content-Type', ''],
    ...(maxBytes ? [['content-length-range', 1, maxBytes]] : []),
  ];
  const policy = Buffer.from(JSON.stringify({
    expiration: new Date(now.getTime() + 5 * 60 * 1000).toISOString(), // 5 minutes, as in the SDK
    conditions,
  })).toString('base64');
  const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
  const signingKey = hmac(hmac(hmac(hmac('AWS4' + secretKey, date), region), 's3'), 'aws4_request');
  return {
    bucket,
    region,
    keyStart,
    uploadURL: `https://${bucket}.s3.${region}.amazonaws.com`,
    params: {
      ...(acl ? { acl } : {}),
      policy,
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-credential': credential,
      'x-amz-date': amzDate,
      'x-amz-signature': crypto.createHmac('sha256', signingKey).update(policy).digest('hex'),
    },
  };
}

module.exports = { s3UploadConfig };
```

The route (Express; requireUser is your auth middleware, which sets req.user):

<!-- validate:skip -->
<!-- Server-side signer parameters (maxBytes, secretKey) are not froala-editor options; this route ran in the test harness. -->
```js
router.get('/api/uploads/s3-config', requireUser, (req, res) => {
  res.json(s3UploadConfig({
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION, // e.g. eu-west-1
    keyStart: `uploads/${req.user.id}/`,
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    maxBytes: 5 * 1024 * 1024,
  }));
});
```
<!-- validate:end -->

The client is the snippet in SKILL.md ("Direct to S3 or Azure"); in the browser run it posted to `https://my-bucket.s3.eu-west-1.amazonaws.com/` with key `uploads/u1/<timestamp>-Photo.png` for images and videos alike.

Use an IAM user or role limited to `s3:PutObject` (and `s3:PutObjectAcl` if you send `acl`) on that bucket prefix.

## S3: bucket setup

- **CORS** on the bucket, from Froala's S3 docs: allow your page's origin, methods `GET`, `POST`, `PUT`, header `*`, `MaxAgeSeconds` 3000.
- **ACLs:** the SDK signers put `acl` (`public-read` in the docs) in the policy and the form. Buckets created with S3 Object Ownership "bucket owner enforced" (the AWS default for new buckets) reject ACLs. Either enable ACLs, or drop `acl` (as the signer above does when no acl is passed) and make the objects readable with a bucket policy or CloudFront.

## Azure: how the editor uploads

`imageUploadToAzure` (and `fileUploadToAzure`, `videoUploadToAzure`) is not in the options docs or `index.d.ts`. From the 5.6.0 source and the browser run:

| Key | Use |
|---|---|
| `account`, `container` | URL: `https://<account>.blob.core.windows.net/<container>/<file name>` |
| `uploadURL` | Used instead: `<uploadURL>/<file name>` |
| `SASToken` | Appended to the URL as is, so it must start with `?` |
| `params` | Sent as request **headers** |
| `accessKey` | **Never use.** Without `SASToken`, the editor signs the request in the browser with this storage account key (via the cryptojs plugin), exposing full account access |

The editor sends `PUT` with the raw file as the body and headers `x-ms-blob-type: BlockBlob`, `x-ms-version: 2019-07-07`, `x-ms-date`, `Content-Type`, plus `imageUploadParams` and `requestHeaders` as headers. Azure must answer **201**. The editor then fires `image.uploadedToAzure(urlWithSas, undefined, response)` (the second argument is the SharedKey signature only in `accessKey` mode; reproduced on 5.6.0, same for `file.` and `video.uploadedToAzure`) and inserts the URL **without** the SAS token, so readers need anonymous read access on the container (or a CDN in front). The first argument contains the SAS token: don't log or store it.

**The blob name is the user's file name.** Two users uploading `image.png` overwrite each other. Re-submit the file under a unique name (tested):

```js
const azure = await fetch('/api/uploads/azure-config', { credentials: 'same-origin' }).then((r) => r.json());
const renamed = new WeakSet(); // files this handler created

new FroalaEditor('#editor', {
  imageUploadToAzure: azure, // { account, container, SASToken: '?sv=...' }
  events: {
    // Froala names the blob after the user's file. Re-submit it under a unique name.
    'image.beforeUpload'(files) {
      const file = files[0];
      if (renamed.has(file)) return true; // a user file named like ours is still renamed
      const ext = (file.type.split('/')[1] || 'bin').replace('jpeg', 'jpg');
      const unique = new File([file], `u-${crypto.randomUUID()}.${ext}`, { type: file.type });
      renamed.add(unique);
      this.image.upload([unique]); // crypto.randomUUID needs HTTPS or localhost
      return false;
    },
  },
});
```

The same pattern works for S3 keys and for your own server if file names must not reach storage.

## Azure: a SAS from the server

Tested offline with `@azure/storage-blob` 12.34.0 (a fake key; the SAS string was generated and the editor used it). A container SAS with only create and write permission, valid for 5 minutes:

<!-- validate:skip -->
<!-- Azure SDK option names (startsOn, expiresOn) are not froala-editor APIs; verified by running @azure/storage-blob 12.34.0. -->
```js
const { StorageSharedKeyCredential, generateBlobSASQueryParameters, ContainerSASPermissions, SASProtocol } = require('@azure/storage-blob');

router.get('/api/uploads/azure-config', requireUser, (req, res) => {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const container = process.env.AZURE_STORAGE_CONTAINER;
  const sas = generateBlobSASQueryParameters({
    containerName: container,
    permissions: ContainerSASPermissions.parse('cw'),
    startsOn: new Date(Date.now() - 60 * 1000),
    expiresOn: new Date(Date.now() + 5 * 60 * 1000),
    protocol: SASProtocol.Https,
  }, new StorageSharedKeyCredential(account, process.env.AZURE_STORAGE_KEY)).toString();
  res.json({ account, container, SASToken: `?${sas}` });
});
```
<!-- validate:end -->

A container SAS lets its holder write any blob name in the container until it expires; keep the expiry short and refresh it like the S3 policy (replace `editor.opts.imageUploadToAzure`). Configure CORS on the storage account to allow `PUT` from your origin with the headers above.

Docs: https://froala.com/wysiwyg-editor/docs/options/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage, https://froala.com/wysiwyg-editor/docs/sdks/nodejs/image-s3-upload/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage
