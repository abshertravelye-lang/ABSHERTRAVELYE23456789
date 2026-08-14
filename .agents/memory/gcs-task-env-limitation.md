---
name: GCS sidecar unavailable in isolated task envs
description: Object storage token exchange fails with 401 "no allowed resources" in task environments; production/main workspace works.
---

The Replit object storage sidecar (127.0.0.1:1106) rejects token exchange with 401 "no allowed resources" inside isolated task environments, even when bucket secrets (PRIVATE_OBJECT_DIR etc.) are present and match the provisioned bucket.

**Why:** the task container's identity token is not authorized on the bucket; only the main workspace/deployed environments are.

**How to apply:** don't try to "fix" GCS auth in a task env — dev uses the local `.local-uploads/` fallback there. The storage routes hard-fail (500, no local fallback) when NODE_ENV=production so uploads can never land on ephemeral disk in prod. Real GCS verification must happen in the main workspace or the published app.
