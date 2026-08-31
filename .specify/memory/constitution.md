# Seiretei Radar — Constitution

Non-negotiable. Any violation blocks the work.

## I. Architecture

- One NestJS module per bounded context.
- Controllers: input validation and HTTP mapping only. No business logic.
- Services: business rules. Repositories: Prisma access.
- All input validated with DTO + class-validator.
- No `any` in public signatures.

## II. Data

- Every `schema.prisma` change requires a versioned migration in the same commit.
- Never edit an applied migration. Never `prisma db push` outside local dev.
- Business invariants expressible as a Postgres constraint MUST live in the
  database, not only in the service. Concurrency-sensitive rules (overlap,
  uniqueness, capacity) always fall in this category.

## III. Testing

- Every rule BR-xx has at least one test naming its ID.
- Rules involving concurrency or exclusivity are tested against a real
  Postgres instance, never a mocked Prisma client.
- Coverage is not the metric. Rule-to-test traceability is.
- A test that passes when its rule is broken is a defect.

## IV. Errors

- Domain exceptions mapped to HTTP in a global filter.
- Never expose Prisma error messages to clients.

## V. Git

- Conventional Commits. One commit per task.
- Branch `feat/&lt;spec-id&gt;-&lt;slug&gt;`.
- Direct push to main is forbidden. `--no-verify` is forbidden.
- Merge is always human.

## VI. Scope

- An agent implements the current task and nothing else.
- Out-of-scope improvements are reported, never applied.
