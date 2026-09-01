## Spec

`specs/002-improve-app-scaffolding/spec.md`

## Business rules

No business rules were introduced or changed by this scaffolding-only feature. Existing relocated coverage retains these verified references:

| ID    | Rule | Test                |
| ----- | ---- | ------------------- |
| BR-02 | Squad `number` must be unique across all squads. | `src/squads/services/squads.service.spec.ts:43`, `src/squads/services/squads.service.spec.ts:66` |
| BR-03 | Squad `maxThreatLevel` must be one of `1`, `2`, or `3`. | `src/squads/services/squads.service.spec.ts:307`, `src/squads/dto/create-squad.dto.spec.ts:40`, `src/squads/dto/update-squad.dto.spec.ts:55`, `src/squads/dto/update-squad.dto.spec.ts:61` |

## Gates

- [x] lint - [x] typecheck - [x] tests - [x] build
- [x] reviewer: APPROVED
- [ ] e2e: PostgreSQL was available; the existing `GET /` expectation fails because the application returns `404`.

## Out of scope

Reorganizing bounded contexts other than Squad, and changing existing API or domain behavior.

## Cost

Tokens: not tracked · USD: not tracked · Duration: not tracked
