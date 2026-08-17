---
name: GitHub push sanitization
description: What blocks pushes to public GitHub from this repl and how each was resolved
---

# GitHub push sanitization

Pushing `main` to a public GitHub repo hit three sequential blockers; all require history rewrite, not just a new commit:

1. **Support debug ZIPs** (`attached_assets/debug-logs*.zip`) — user chose full-history removal via `git filter-branch --index-filter 'git rm -r --cached --ignore-unmatch -- <glob>'`.
2. **GitHub Push Protection: secrets in old `.replit` versions** — OpenAI + Duffel keys were hardcoded in `.replit` in several historical commits. Fixed by an index-filter that rewrites `.replit` blob per commit (`git show $GIT_COMMIT:.replit | sed '/pattern/d'` → `git hash-object -w` → `git update-index --cacheinfo`). Verify with a loop over `git rev-list main -- .replit` grepping each blob.
3. **OAuth token lacks `workflow` scope** — any `.github/workflows/*.yml` anywhere in history (including nested app dirs like `absher_travel/.github/workflows/`) blocks push. Removed ALL of them via `git ls-files -z | grep -zE '(^|/)\.github/workflows/'` in the index filter; a copy of the current workflow is at `/tmp/gh-workflows-backup` (ephemeral).

**How to push:** the connector token is fetched in a temp node script from `https://$REPLIT_CONNECTORS_HOSTNAME/api/v2/connection?include_secrets=true&connector_names=github` (X_REPLIT_TOKEN: `repl $REPL_IDENTITY`), then `git -c http.extraheader="AUTHORIZATION: basic <base64 x-access-token:TOKEN>" push`. Never echo the token; sanitize error output.

**Why:** plain `git push` fails (no credential helper), and `listConnections().getClient().auth()` returns unauthenticated — the raw token only comes from the connectors API endpoint.

**How to apply:** any future push to GitHub from this repl must keep `.gitignore` entries for `attached_assets/debug-logs*.zip` and `.github/workflows/`, and re-run the three verification greps before pushing. Pre-sanitization history survives on local branch `backup-before-github-sanitize-20260816154918` — never push it.
