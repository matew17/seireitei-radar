## Spec

`specs/004-return-threat-candidates/spec.md`

## Business rules

| ID | Rule | Test |
| --- | ---- | ---- |
| BR-01 | Return every available squad whose maximum threat capability meets the submitted threat level. | `src/threat-alerts/services/threat-alerts.service.spec.ts:54` |
| BR-04 | Reject threat levels outside 1, 2, and 3 without returning candidates or persisting invalid data. | `src/threat-alerts/services/threat-alerts.service.spec.ts:68` |

## Gates

- [x] lint - [x] typecheck - [x] tests - [x] build
- [x] reviewer: APPROVED

## Out of scope

Authentication, authorization, squad assignment, and changes to candidate eligibility criteria.

## Cost

Tokens: not recorded · USD: not recorded · Duration: not recorded
