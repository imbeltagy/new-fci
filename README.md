# new-fci

Turborepo + pnpm monorepo: two Next.js 16 apps (`client` on :3000, `admin` on :3001) sharing the `@repo/common` package, and a standalone Express + TypeScript API (`server` on :4000) with MongoDB and Redis.

## Quick start

```bash
pnpm install
docker compose up -d mongo redis   # databases needed for local dev
pnpm dev                           # turbo TUI: one tab per app
```

API docs (Swagger UI): http://localhost:4000/docs

## Adding a shadcn component

This is a monorepo setup, so it differs from the default shadcn flow: components are **not** installed into the app — the CLI detects the workspace and writes them into `packages/common/src/components/ui`, where both apps import them from.

Run from the repo root, pointing the CLI at one of the Next.js apps with `-c`:

```bash
pnpm dlx shadcn@latest add button -c apps/client
```

(Equivalently: `cd apps/client && pnpm dlx shadcn@latest add button`. Either app works as the target — the component always lands in `packages/common`.)

Then import it via the package subpath:

```tsx
import { Button } from "@repo/common/components/ui/button";
```

## Database Setup

### Run Migrations

Apply pending Prisma migrations:

```bash
docker compose exec server pnpm db:migrate
```

### Reset Database

If your local database is out of sync with the migration history, reset it and reapply all migrations:

```bash
docker compose exec server npx prisma migrate reset
```

⚠️ This will delete all data in the database.

### Seed Database

Populate the database with development seed data:

```bash
docker compose exec server node dist/seed/seed.js
```

### Full Reset Workflow

For a completely fresh database:

```bash
docker compose exec server npx prisma migrate reset
docker compose exec server node dist/seed/seed.js
```

## More

See [CLAUDE.md](./CLAUDE.md) for the full structure, commands, env vars, and conventions.
