# Data Model: ThreatAlert CRUD

## ThreatAlert

Represents a reported threat that operations staff can record, inspect, correct, and resolve.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | System-generated unique identity. |
| `threatLevel` | integer | Yes | Must be 1, 2, or 3. Covers BR-04. |
| `latitude` | number | Yes | Reported threat location coordinate. |
| `longitude` | number | Yes | Reported threat location coordinate. |
| `status` | `PENDING`, `ASSIGNED`, or `RESOLVED` | Yes | Defaults to `PENDING`; only removal changes it in this feature. |
| `squadId` | string or null | No | Optional reference to a Squad; creation and update leave it unchanged in this feature. |
| `createdAt` | timestamp | Yes | System-generated and immutable. |

### Validation Rules

- BR-04: `threatLevel` must be 1, 2, or 3. Enforce with DTO validation and a named PostgreSQL `CHECK` constraint in a versioned migration; test the constraint against real PostgreSQL.
- Create requires `threatLevel`, `latitude`, and `longitude`; it sets status to `PENDING` and leaves `squadId` null.
- Update accepts a non-empty subset of `threatLevel`, `latitude`, and `longitude` only; omitted values are preserved.
- `latitude` and `longitude` must be numeric values.
- BR-01: On creation, query all Squads whose `isAvailable` is true and `maxThreatLevel >= threatLevel`. This lookup does not create or change a squad relationship.

### State Transitions

| Action | State Change |
|--------|--------------|
| Create | Creates an unassigned alert with `PENDING` status and evaluates BR-01 eligibility. |
| Update | Corrects supplied severity and/or location fields only. |
| Remove | Sets `status` to `RESOLVED`; the record remains in list results. |

### Relationships

- A ThreatAlert may optionally reference one Squad through `squadId`.
- Creation queries eligible Squads under BR-01 but does not assign any squad.
