---
name: OpenAI via Replit AI Integrations proxy
description: OCR/photo-validation use the Replit-managed OpenAI proxy, not the user's key
---

The user's own `OPENAI_API_KEY` ran out of credits (429 credit_balance_exhausted), which was the real cause of "OCR failing". The API server's OpenAI client now prefers `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY` (both must be set) and falls back to `OPENAI_API_KEY`.

**Why:** proxy is billed to Replit credits and needs no user key; a base-URL-only config must not silently create a broken client.

**How to apply:** new AI features on the server should reuse this client pattern; don't ask the user for OpenAI credits.
