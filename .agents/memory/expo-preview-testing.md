---
name: Expo preview testing
description: How to reach the Expo mobile app for screenshots/e2e testing
---
Expo apps bypass the workspace shared proxy. **Rule:** all browser testing/screenshots of the mobile app must target `https://$REPLIT_EXPO_DEV_DOMAIN/<route>` (routes at root: /, /onboarding, /welcome, ...).
**Why:** navigating to `/absher-mobile/` on the main dev domain serves HTML instead of the JS bundle → app never mounts, blank white page, false "app broken" verdicts.
**How to apply:** instruct testing subagents explicitly to resolve REPLIT_EXPO_DEV_DOMAIN and use it; the Screenshot tool with artifactDirName handles this automatically.

Also: visa application submission is profile-driven server-side (POST /visa-applications builds the record from the STORED profile; client fields are ignored) — any mobile/web apply flow must persist data via profile update before submitting, use a real visaId, and never fabricate success/tracking numbers on error.
