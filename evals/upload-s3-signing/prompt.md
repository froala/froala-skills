---
description: Direct browser-to-S3 uploads use imageUploadToS3 with a policy signed on the server; the AWS secret key never reaches the browser.
tags: [uploads, s3, security]
allowed_tools: [Read, Glob, Grep, Skill]
---

Our Froala editor runs in a React app and our backend is Node/Express. We want images to upload straight from the browser to our S3 bucket instead of going through our server. Show me the Froala config and whatever the backend needs. Our AWS keys are in the backend's environment variables.
