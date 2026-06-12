# new-fci

Turborepo + pnpm monorepo: `client` (Next.js 16, :3000), `admin` (Next.js 16, :3001),
`server` (Express 5 + TS + Mongo + Redis, :4000), shared `@repo/common` package.
**Always use pnpm, never npm/yarn.**

## MANDATORY workflow before implementing anything

This is a strict, non-negotiable rule for every implementation request. Do **NOT** write or
edit any code until you have completed all three steps below in order:

1. **Investigate & ask until 100% certain.** Search the codebase and the relevant
   `./claude/` docs, then ask me as many questions as needed to remove **every** ambiguity.
   Do not assume, do not fill gaps with defaults, do not start coding while anything is
   still unclear. Keep asking until you are 100% sure exactly what to build.
2. **Present the exact plan.** Once certain, tell me precisely what you will do: the logic
   and behavior, every new or modified file (with paths), every new component, type, route,
   action/query, DB model, etc., and how they fit together.
3. **Wait for my decision.** I will either modify the plan or explicitly permit you to
   proceed. Only after I grant permission may you start implementing. Never skip ahead to
   coding on your own.

Detailed docs are split by topic — read only the file you need:

- App architecture (monorepo layout, `@repo/common` structure, server structure, Docker,
  code conventions) → [./claude/architecture.md](./claude/architecture.md)
- Application business (what the product is, roles, value proposition) →
  [./claude/business.md](./claude/business.md)
- Delivery plan & feature status (what's built / being built / next) →
  [./claude/roadmap.md](./claude/roadmap.md)
- Per-feature user stories and rules → [./claude/features/](./claude/features/)
  (read the file for the feature you're working on)
- Development workflow (commands, turbo TUI, env vars, adding shadcn components, Swagger) →
  [./claude/development.md](./claude/development.md)
