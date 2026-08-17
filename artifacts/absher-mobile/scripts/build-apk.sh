#!/usr/bin/env bash
# One-command Android APK rebuild via EAS cloud build.
#
# Usage (from repo root or artifacts/absher-mobile):
#   pnpm --filter @workspace/absher-mobile run apk            # preview APK (installable)
#   pnpm --filter @workspace/absher-mobile run apk production # Play Store AAB
#
# Requirements (already configured as Replit secrets):
#   EXPO_TOKEN      — Expo access token (account: abshertravel)
#   EAS_PROJECT_ID  — Expo project UUID (project slug: absher)
#
# The API origin baked into the app comes from eas.json → build.<profile>.env.EXPO_PUBLIC_DOMAIN.
set -euo pipefail

PROFILE="${1:-preview}"
case "$PROFILE" in
  preview|production) ;;
  *) echo "❌ Invalid profile: $PROFILE (use: preview | production)" >&2; exit 1 ;;
esac

cd "$(dirname "$0")/.."

: "${EXPO_TOKEN:?EXPO_TOKEN secret is missing}"
: "${EAS_PROJECT_ID:?EAS_PROJECT_ID secret is missing}"

echo "🚀 Starting EAS cloud build (profile: $PROFILE)…"
BUILD_JSON=$(pnpm dlx eas-cli@latest build \
  --platform android \
  --profile "$PROFILE" \
  --non-interactive \
  --no-wait \
  --json 2>/dev/null)

BUILD_ID=$(echo "$BUILD_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log((Array.isArray(d)?d[0]:d).id)")
echo "📦 Build started: $BUILD_ID"
echo "   Logs: https://expo.dev/accounts/abshertravel/projects/absher/builds/$BUILD_ID"

echo "⏳ Waiting for build to finish (~20 min)…"
while true; do
  sleep 60
  VIEW_JSON=$(pnpm dlx eas-cli@latest build:view "$BUILD_ID" --json 2>/dev/null || echo '{}')
  STATUS=$(echo "$VIEW_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.status||'UNKNOWN')")
  echo "   status: $STATUS ($(date +%H:%M:%S))"
  case "$STATUS" in
    FINISHED) break ;;
    ERRORED|CANCELED) echo "❌ Build $STATUS — check the logs URL above." >&2; exit 1 ;;
  esac
done

URL=$(echo "$VIEW_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.artifacts?.applicationArchiveUrl||'')")
if [ -z "$URL" ]; then
  echo "❌ Build finished but no artifact URL found." >&2
  exit 1
fi

EXT="apk"; [ "$PROFILE" = "production" ] && EXT="aab"
OUT="build-output/abshertravel-$PROFILE.$EXT"
mkdir -p build-output
echo "⬇️  Downloading artifact…"
curl -sL -o "$OUT" "$URL"
echo "✅ Done: artifacts/absher-mobile/$OUT ($(du -h "$OUT" | cut -f1))"
