---
name: lib tsconfig types-node issue
description: Composite lib packages (lib/db, lib/countries) must not use types:["node"] — tsc --build fails to resolve it.
---
**Rule:** Do not set `"types": ["node"]` in tsconfig.json for composite lib packages.

**Why:** When `tsc --build` runs in composite mode, it resolves type roots differently. Even if `@types/node` is installed in the lib's local node_modules, tsc --build cannot find it and throws `Cannot find type definition file for 'node'`.

**How to apply:** If a lib schema file needs Node.js types, use triple-slash refs or avoid direct Node.js imports in lib code.
