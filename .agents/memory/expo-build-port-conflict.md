---
name: Expo build port conflict
description: The mobile static build assumes Metro can use port 8081, which may be held by mockup-sandbox.
---

The Expo mobile build script is non-interactive and cannot accept Metro's "use another port?" prompt. If mockup-sandbox owns port 8081, stop that managed workflow before running the mobile build, then restore it afterward.

**Why:** parallel artifact workflows can make a successful mobile codebase appear to have a broken build when Metro exits at the port prompt.

**How to apply:** keep the normal workflows running during development, but serialize the one-off mobile build around the mockup-sandbox workflow.