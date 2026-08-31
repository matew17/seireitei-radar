# Seiretei Radar

NestJS + Prisma + PostgreSQL. Threat alert service for the seretei.

## Commands

- `npm run build` · `npm run lint` · `npm test` · `npm run test:e2e`
- `npx prisma migrate dev --name` · `npx prisma generate`

## Layout

- `src/` — one NestJS module per bounded context
- `prisma/schema.prisma` — schema. Migrations in `prisma/migrations/`
- `specs/` — feature specs (Spec Kit)
- `docs/business-rules.md` — business rules, IDs BR-xx
- `.specify/memory/constitution.md` — non-negotiable principles

## Non-negotiables

Read `.specify/memory/constitution.md` before writing code.
Never push to main. Never use `--no-verify`.
