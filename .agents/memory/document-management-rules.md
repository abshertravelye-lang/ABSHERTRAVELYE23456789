---
name: Document management rules
description: Durable security/correctness decisions for the visa document-request pipeline
---
- Staff access to stored object files must be relationship-scoped: an agent may read a file only if it is referenced by a document version / application submission AND the agent holds a viewing permission (visa_applications or documents_review). `documents_request` alone never grants file reads; only super_admin/admin have broad access.
  **Why:** an early blanket grant let any permissioned agent read arbitrary customers' passports.
- Every upload path (direct upload AND request-url flows) must record object ownership at creation, or the object fails all later authorization checks.
- Document create/upload endpoints are idempotent by design: unique(applicationId, documentKey) for requests, unique(documentId, storagePath) + FOR UPDATE versioning for uploads. Retries/double-clicks must never create duplicates or duplicate notifications.
- Spec decision: document status is deliberately independent from application status — do not couple them.
- Frontend raw multipart uploads must go through a refresh-aware fetch (15-min tokens); the generated client's 401-retry can't replay FormData, so use the shared upload helper, never a bare fetch.
