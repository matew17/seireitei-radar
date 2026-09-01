# Data Model: Improve Application Scaffolding

## Model Changes

None. This feature changes source-file organization and implementation guidance only.

Existing Squad and threat-related Prisma models, relationships, validation rules, lifecycle behavior, and database constraints remain unchanged. No Prisma migration is required.

## Structural Model

| Location | Responsibility | Constraints |
|----------|----------------|-------------|
| `<context>/controllers/` | HTTP mapping | Controllers contain no business logic. |
| `<context>/dto/` | Request DTOs | DTOs retain class-validator validation. |
| `<context>/services/` | Application and domain behavior | Services enforce business rules not represented by database constraints. |
| `<context>/repositories/` | Prisma access | Repositories are the only location for context-specific Prisma access. |
| `<context>/<context>.module.ts` | NestJS composition | The only file retained at a bounded context root. |
| `src/common/` | Cross-cutting code | Must not contain behavior owned by a specific bounded context. |

Tests are co-located with the source file or DTO they verify.
