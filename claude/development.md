# Development workflow

## Commands (run from repo root)

```bash
pnpm install              # install everything
pnpm dev                  # run all apps in dev mode (turbo TUI: one tab per app)
pnpm build                # build all apps
pnpm lint                 # lint all apps
pnpm --filter client dev  # run a single app (client | admin | server)

docker compose up -d mongo redis   # just the databases (needed for local dev)
docker compose up --build          # full stack in Docker
```

Turbo runs with `"ui": "tui"` (`turbo.json`): each task gets its own tab — switch with
arrow keys / `j`/`k`, `Enter` to focus a tab's logs, `Ctrl+Z` to interact with a task.

API docs (Swagger UI): http://localhost:4000/docs

## Environment variables

Each app has a committed `.env` (with matching `.env.example`):

- `apps/server/.env` — `PORT`, `MONGODB_URI`, `REDIS_URL`
- `apps/client/.env`, `apps/admin/.env` — `NEXT_PUBLIC_API_BASE_URL` (build-time inlined; in Docker it is passed as a build arg)

## Adding a shadcn component

Run from the repo root; the CLI detects the monorepo and writes into
`packages/common/src/components/ui` (never into the app):

```bash
pnpm dlx shadcn@latest add <component> -c apps/client
```

Then import via `@repo/common/components/ui/<component>`.
