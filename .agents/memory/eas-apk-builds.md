---
name: EAS Android builds from Replit
description: How to build the Android APK for the mobile app from inside the workspace via EAS cloud builds.
---

# EAS Android builds (cloud) from the Replit workspace

The workspace has no Java/Gradle/adb — Android builds must go through EAS cloud builds.

**How to apply:**
- Use `pnpm dlx eas-cli@latest` (installing eas-cli as a dependency fails at the workspace root).
- Auth via the `EXPO_TOKEN` secret; project UUID in `EAS_PROJECT_ID` secret. Account: `abshertravel`, EAS project slug: `absher`.
- `app.json` must have `slug` matching the EAS project's slug (`absher`) and `owner: "abshertravel"` — a slug mismatch with `extra.eas.projectId` hard-blocks all eas commands.
- `eas.json` production `buildType` must be `app-bundle` (not `aab` — invalid and rejected).
- Bake the API origin into the bundle via the build profile: `env.EXPO_PUBLIC_DOMAIN = "abshertravel.com"` (production domain from getDeploymentInfo, NOT the .replit.dev domain) plus `env.EAS_PROJECT_ID` since app.config.js reads it.
- Launch with `--no-wait`, then poll `eas build:view <id>`; a preview APK build takes ~20 min. Download the finished "Application Archive URL" with curl and deliver via `presentAsset`.
- One-command rebuild exists: `pnpm --filter @workspace/absher-mobile run apk [preview|production]` (scripts/build-apk.sh) — launches, polls, downloads to build-output/. GitHub Actions CI path stays blocked: connector token lacks `workflow` scope, so `.github/workflows/` cannot be pushed (see github-push-sanitization.md).

**Why:** first build attempt failed twice on config alone (aab buildType, slug mismatch); this sequence produced a working 93MB APK.
