# Data Model: Auto-Assign Squad

## ThreatAlert

Existing fields used by automatic assignment:

| Field | Meaning | Assignment rule |
|-------|---------|-----------------|
| `id` | Alert identity | Target of the request. |
| `threatLevel` | Required response capability, 1 through 3 | BR-04; candidate must meet or exceed it under BR-05. |
| `status` | `PENDING`, `ASSIGNED`, or `RESOLVED` | BR-07 permits automatic assignment only from `PENDING`. |
| `squadId` | Optional assigned squad reference | Becomes the selected squad on success; remains null when no squad qualifies. |

State transitions:

| From | Action | To | Guard |
|------|--------|----|-------|
| `PENDING`, no squad | Automatic assignment | `ASSIGNED`, selected squad | BR-01, BR-05, BR-06, BR-07 |
| `PENDING`, no squad | No eligible squad | Unchanged | BR-01, BR-05 |
| `ASSIGNED` or `RESOLVED` | Automatic assignment | Unchanged, conflict result | BR-07 |

## Squad

Existing fields used by automatic assignment:

| Field | Meaning | Assignment rule |
|-------|---------|-----------------|
| `id` | Squad identity | Stored in `ThreatAlert.squadId`. |
| `number` | Unique operational number | BR-02 makes it unique; BR-06 selects the lowest eligible value. |
| `isAvailable` | Current availability | Must be true at assignment time under BR-01 and BR-05; remains unchanged after assignment. |
| `maxThreatLevel` | Highest supported threat level, 1 through 3 | BR-03; must be at least the alert level under BR-01 and BR-05. |

## Persistence Constraints

- A PostgreSQL constraint trigger rejects a transition to `ASSIGNED` unless the prior alert state is pending and unassigned and the selected squad is currently available with sufficient capability. It locks the squad row while checking eligibility.
- No schema fields are added. The migration is still versioned because it adds database constraints.
