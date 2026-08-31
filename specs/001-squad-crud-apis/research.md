# Research: Squad CRUD APIs

## Decision: Use a dedicated `squads` bounded-context module

**Rationale**: The constitution requires one NestJS module per bounded context. Squad management has its own API, DTOs, service rules, repository access, and tests.

**Alternatives considered**: Adding methods to `AppController` or `AppService` was rejected because it mixes bounded contexts and violates the architecture principle.

## Decision: Keep Prisma access inside a repository

**Rationale**: The constitution explicitly assigns Prisma access to repositories. This keeps controllers free of business logic and services free of persistence mechanics.

**Alternatives considered**: Injecting Prisma directly into services was rejected because it violates the required service/repository split.

## Decision: Implement removal by setting `isAvailable` to `false`

**Rationale**: Clarification selected removal as marking squads unavailable. This preserves historical references from threat alerts and prevents unavailable squads from matching BR-01 assignment eligibility.

**Alternatives considered**: Hard delete was rejected because it can erase operational history. Delete-only-if-unused was rejected because it creates inconsistent removal behavior for clients.

## Decision: Return all squads in roster reads

**Rationale**: Clarification selected including unavailable squads in roster results. This lets operations staff inspect removed/unavailable squads while BR-01 still excludes unavailable squads from threat assignment eligibility.

**Alternatives considered**: Returning only available squads was rejected because it would hide removed records from normal CRUD verification.

## Decision: Support partial updates

**Rationale**: Clarification selected partial updates. This allows operations staff to change common fields such as availability or coordinates without resending unchanged values.

**Alternatives considered**: Full replacement was rejected because it increases accidental data overwrite risk and unnecessary client burden.

## Decision: Enforce BR-03 with a PostgreSQL check constraint and DTO validation

**Rationale**: The constitution requires database enforcement for business invariants expressible in PostgreSQL. DTO validation gives client-friendly failures, while the database check constraint protects concurrent and direct persistence paths.

**Alternatives considered**: Service-only validation was rejected because it would violate the data principle. Prisma-only model annotations were rejected because Prisma schema does not express this check constraint directly for PostgreSQL.

## Decision: Map domain and persistence failures to client-safe errors

**Rationale**: The constitution forbids exposing Prisma errors. Domain exceptions plus a global exception filter provide consistent not-found, validation, and conflict responses.

**Alternatives considered**: Returning raw Prisma errors or handling each error ad hoc in controllers was rejected because it leaks internals and places business/error logic in controllers.
