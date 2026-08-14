---
name: Git branch switches can wipe in-session work
description: What to do when the user reports "all our work was deleted" in this repl
---
The user (or platform merges) sometimes switches git branches from the git pane, which replaces the working tree and makes finished in-session work vanish while the chat continues.

**Why:** On 2026-08-12 the whole mobile redesign "disappeared"; it was intact on branch `absherbusinessyemen1` ("Git commit prior to merge") while HEAD had moved to an older `replit-agent` commit.

**How to apply:** When work seems lost, do NOT rebuild. Check `git reflog`, all local branches and `gitsafe-backup/*` for the latest commit containing a known marker symbol (git grep). Recover with: safety-commit current tree → save current diff as patch → `git checkout <good-commit> -- .` → `git apply -3` the patch → resolve conflicts → regenerate codegen from openapi.yaml instead of hand-merging generated files.
