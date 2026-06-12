# Architecture

Turborepo + pnpm monorepo. **Always use pnpm, never npm/yarn.**

## Apps & ports

| App | Path | Stack | Port |
| --- | --- | --- | --- |
| client | `apps/client` | Next.js 16 (App Router, Tailwind v4, shadcn) | 3000 |
| admin | `apps/admin` | Next.js 16 (App Router, Tailwind v4, shadcn) | 3001 |
| server | `apps/server` | Express 5 + TypeScript, Mongoose, ioredis | 4000 |

`packages/common` (`@repo/common`) is the shared package for the two Next.js apps.
The server is intentionally standalone — it shares nothing with `@repo/common`.

## `@repo/common` layout (`packages/common/src`)

- `components/ui/` — shadcn components (managed by the shadcn CLI)
- `components/custom/` — hand-written shared components
- `actions/` — plain async functions that call the API (`*.action.ts`)
- `queries/` — React Query hooks that wrap actions (`*.query.ts`)
- `hooks/` — shared React hooks
- `stores/` — Zustand stores (`*.store.ts`)
- `configs/`, `constants/`, `types/`, `utils/`, `lib/` (shadcn `cn` helper)
- `styles/globals.css` — the single Tailwind/shadcn theme entry; apps import it in their root layout
- `eslint/` (package root) — shared ESLint flat-config spread into each app's `eslint.config.mjs`

Subpath imports are defined in `packages/common/package.json` `exports`, e.g.
`@repo/common/queries/healthcheck.query`. Apps transpile the package via
`transpilePackages: ["@repo/common"]` in `next.config.ts`.

## Server layout (`apps/server/src`)

- `index.ts` — loads `.env`, connects Mongo + Redis, then starts Express
- `db/mongo.ts`, `db/redis.ts` — one file per database, each exports its connect function
- `<feature>/` — `*.controller.ts` (Express router), `*.service.ts`, `*.repository.ts` (see `healthcheck/`)
- `swagger/generate.ts` — auto-generates the OpenAPI spec with `swagger-autogen` by scanning
  the routes (no manual annotations). Runs automatically before `dev` and `build`
  (`pnpm --filter server swagger` to run it alone). The output
  (`src/swagger/swagger-output.json`) is gitignored and served at **`/docs`** via
  `swagger-ui-express`. New routers registered in `index.ts` are picked up automatically.

## Docker

- One multi-stage `Dockerfile` per app in `apps/*/Dockerfile`; all must be built from the **repo root** (`docker build -f apps/<app>/Dockerfile .`) because they use `turbo prune`.
- `docker-compose.yml` runs mongo (volume `mongo-data`), redis (volume `redis-data`), server, client, admin.
- Next.js apps use `output: "standalone"`.

## Conventions

- New API call: add an action in `common/src/actions`, wrap it in a React Query hook in `common/src/queries`, use the hook in pages.
- App pages live in `apps/<app>/src/app`; anything reused by both apps goes in `@repo/common`.
- Each Next app wraps the root layout with `Providers` (`src/app/providers.tsx`) for React Query.
- File suffixes: `*.action.ts`, `*.query.ts`, `*.store.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`.
