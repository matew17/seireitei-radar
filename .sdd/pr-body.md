## Spec

`specs/001-squad-crud-apis/spec.md`

## Business rules

| ID | Rule | Test |
| --- | ---- | ---- |
| BR-01 | Select available squads whose maximum threat level meets a new threat's level | No test reference: threat creation is out of scope |
| BR-02 | Squad number is unique | `src/squads/squads.service.spec.ts:43` |
| BR-03 | Maximum threat level is 1, 2, or 3 | `src/squads/squads.service.spec.ts:307` |

## Gates

- [x] lint - [x] typecheck - [x] tests - [x] build
- [x] reviewer: APPROVED

## Out of scope

Threat creation and BR-01 squad selection behavior are excluded from this Squad CRUD spec.

## Cost

Tokens: N/A · USD: N/A · Duration: N/A
