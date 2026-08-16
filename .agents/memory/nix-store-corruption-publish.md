---
name: Nix store corruption blocking publish
description: How a corrupt /nix/store path made every publish stall ("self-healing corrupt nix store paths") and fail with HostingBuild.image_tag error, and how it was fixed.
---

# Corrupt Nix store path blocks publishing

**Symptom:** Every publish attempt built the app successfully, then looped on
`warning: self-healing 1 corrupt nix store paths from binary cache: [...-pub-io-1.0.5]`,
re-pushed the nix-0 layer repeatedly, and eventually failed with
`HostingBuild.image_tag is required to send Deploy, UpdateTier, and Resume lifecycle actions`.

**Root cause:** A store path in the repl's local-overlay Nix store was corrupted
(hash mismatch), and repair was blocked because a stray `<path>.lock` **directory**
(with read-only contents) existed where Nix expected a lock *file*.

**Fix that worked (in order):**
1. `nix-store --verify-path <path>` → confirms "was modified" (hash mismatch).
2. `nix-store --repair-path <path>` → fails with `opening lock file '<path>.lock': Is a directory`.
3. `chmod -R u+w <path>.lock && rm -rf <path>.lock`
4. `nix-store --repair-path <path>` → re-fetches from cache.nixos.org.
5. `nix-store --verify-path <path>` → clean.

**Why:** The publish pipeline verifies nix store integrity before caching the layer;
it retries self-healing forever instead of failing fast, so the deployment never
gets an image tag. Deleting the path is usually impossible (dozens of pubcache
referrers reappear); repairing it in place is the reliable fix.

**How to apply:** If publish logs show "self-healing N corrupt nix store paths",
don't touch the app code, database, or republish repeatedly — repair the named
store path in the workspace shell first, then republish once.
