# Business Rules — Seiretei Radar

Stable IDs. Never renumber. Deprecate instead.

| ID    | Rule                                                            | Enforced at                      |
| ----- | --------------------------------------------------------------- | -------------------------------- |
| BR-01 | When a new threat is created, query for all Squads where `isAvailable` is `true` AND `maxThreatLevel` is greater than or equal to `threatLevel`. | DB constraint + integration test |
| BR-02 | Squad `number` must be unique across all squads. | DB unique constraint + integration test |
| BR-03 | Squad `maxThreatLevel` must be one of `1`, `2`, or `3`. | DB check constraint + DTO validation + integration test |
| BR-04 | ThreatAlert `threatLevel` must be one of `1`, `2`, or `3`. | DB check constraint + DTO validation + integration test |
| BR-05 | An automatically assigned squad must be available and support a threat level at least equal to the alert's threat level at the time of assignment. | Assignment service + PostgreSQL-backed eligibility check + integration test |
| BR-06 | When multiple squads are eligible for automatic assignment, select the squad with the lowest unique squad number. | Assignment service + integration test |
| BR-07 | Automatic squad assignment is permitted only for a pending, unassigned threat alert. | Assignment service + integration test |

## Open questions
