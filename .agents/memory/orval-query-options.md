---
name: Orval hook query options need explicit queryKey
description: Passing custom query options to generated @workspace/api-client-react hooks requires queryKey
---

When calling a generated hook with custom `query` options (e.g. `enabled`, `refetchInterval`), TypeScript requires `queryKey` to be included explicitly — use the generated `get...QueryKey()` helper.

**Why:** The generated `UseQueryOptions` type marks `queryKey` as required once you override options; omitting it fails with TS2741.

**How to apply:** `useX({ query: { queryKey: getXQueryKey(), enabled, ... } })`.
