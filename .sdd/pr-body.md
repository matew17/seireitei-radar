## Spec

`specs/003-threatalert-crud/spec.md`

## Business rules

| ID | Rule | Test |
| --- | --- | --- |
| BR-01 | Creating an alert identifies available squads whose maximum threat level can handle the reported threat level. | `test/threat-alerts.e2e-spec.ts:34` |
| BR-04 | A threat level must be 1, 2, or 3, enforced by PostgreSQL and request validation. | `test/threat-alerts.e2e-spec.ts:113` |

## Gates

- [x] lint - [x] typecheck - [x] tests - [x] build
- [x] reviewer: APPROVED

## Out of scope

Assigning an eligible squad during alert creation; eligibility is identified only.

## Cost

Tokens: unavailable · USD: unavailable · Duration: unavailable
