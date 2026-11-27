# Gateway

The gateway is the building's source-of-truth service. It runs on the guard PC and serves the tenant API on a private LAN interface.

## Run locally

Requirements: Node.js 20+, pnpm 10, and native build tools if `better-sqlite3` has no prebuilt binary for your platform.

```bash
corepack pnpm install
corepack pnpm --filter @smth-nice/gateway build
corepack pnpm --filter @smth-nice/gateway test
```

Copy `gateway.config.example.json` to `gateway.config.json`, then start:

```bash
corepack pnpm --filter @smth-nice/gateway dev
```

Or run the compiled server:

```bash
corepack pnpm --filter @smth-nice/gateway start
```

## Configuration

`gateway.config.json` is ignored by Git and must not contain secrets shared outside this PC.

- `host`: private LAN address to bind. Never use `0.0.0.0` unless that interface policy is explicitly accepted.
- `port`: gateway HTTP port.
- `lanSubnets`: reserved for the LAN source-IP restriction implemented in phase 2.
- `databasePath`: SQLite database location. The parent directory is created automatically.
- `corsOrigin`: intended tenant PWA origin. Phase 2 will configure CORS explicitly.

SQLite migrations in `migrations/` run automatically when the gateway starts.

## Phase 1 endpoints

- `GET /api/v1/health`

## Testing

```bash
corepack pnpm --filter @smth-nice/gateway test
```

## Environment Variables

- `COOKIE_SECURE`: Set to `true` in the environment only when the gateway is served over HTTPS. It defaults to `false` for local HTTP development and LAN setup. The secure flag is applied consistently to login and logout cookies.
