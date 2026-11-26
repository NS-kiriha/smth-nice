# smth-nice

Apartment rental management for one building.

- `apps/gateway` runs on the guard PC. It is the source of truth (Fastify, SQLite) and will serve the tenant PWA on the LAN.
- `apps/relay` is the cloud process that connects the owner PWA to the gateway. It does not expose tenant routes.
- `apps/tenant-app` and `apps/owner-app` are the PWAs.

Tenant app data stays on the LAN. The gateway calls out to the relay. The relay never accepts a new inbound connection from the public internet into the building.

## Requirements

- Node.js 20 or newer
- pnpm 10

This repo pins `packageManager` to pnpm 10.26.0. If `pnpm` is not on your PATH, prefix commands with `corepack` (it ships with Node):

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

`better-sqlite3` and `argon2` compile native code when the gateway is added. On Windows, a missing prebuild means you need the Visual Studio C++ build tools.

## Layout

| Path | Status |
| --- | --- |
| `packages/shared` | Zod schemas shared by the gateway and the PWAs |
| `apps/gateway` | Building data, tenant API `/api/v1` |
| `apps/relay` | Placeholder until phase 3 |
| `apps/tenant-app` | Placeholder until phase 2 |
| `apps/owner-app` | Placeholder until phase 4 |

Each app has its own README for how to run and configure it.
