# Shared

Zod schemas and the types inferred from them. The gateway validates input with these schemas. Later phases reuse them in the tenant and owner apps.

JSON fields are camelCase. SQLite columns stay snake_case inside the gateway.

## Build

From the repo root:

```bash
corepack pnpm install
corepack pnpm --filter @smth-nice/shared build
```

Output is `dist/`. Other packages import `@smth-nice/shared`, which points at that build.
