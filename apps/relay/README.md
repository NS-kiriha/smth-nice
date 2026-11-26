# Relay

Cloud process that will connect the owner PWA to a building gateway (phase 3).

The relay stores owner accounts and queued messages. It does not store building data long-term, and it does not expose tenant endpoints.

## Run the placeholder

From the repo root:

```bash
corepack pnpm install
corepack pnpm --filter @smth-nice/relay build
corepack pnpm --filter @smth-nice/relay start
```

The process prints `relay: not implemented (phase 3)` and exits. There is no configuration yet.
