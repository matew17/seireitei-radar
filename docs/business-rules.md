# Business Rules — Seiretei Radar

Stable IDs. Never renumber. Deprecate instead.

| ID    | Rule                                                            | Enforced at                      |
| ----- | --------------------------------------------------------------- | -------------------------------- |
| BR-01 | When a new threat is created, query for all Squads where `isAvailable` is `true` AND `maxThreatLevel` is greater than or equal to `threatLevel`. | DB constraint + integration test |

## Open questions
