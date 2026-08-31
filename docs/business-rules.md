# Business Rules — Seiretei Radar

Stable IDs. Never renumber. Deprecate instead.

| ID    | Rule                                                            | Enforced at                      |
| ----- | --------------------------------------------------------------- | -------------------------------- |
| BR-01 | When a new threat is created, query for all Squads where `isAvailable` is `true` AND `maxThreatLevel` is greater than or equal to `threatLevel`. | DB constraint + integration test |
| BR-02 | Squad `number` must be unique across all squads. | DB unique constraint + integration test |
| BR-03 | Squad `maxThreatLevel` must be one of `1`, `2`, or `3`. | DB check constraint + DTO validation + integration test |

## Open questions
