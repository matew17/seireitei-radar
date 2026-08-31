# Data Model: Squad CRUD APIs

## Squad

Represents a Seireitei response unit that can be managed by operations staff and considered by threat assignment workflows.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | System-generated unique identity. |
| `number` | integer | Yes | Unique squad number. Covers BR-02. |
| `captainName` | string | Yes | Must not be blank. |
| `isAvailable` | boolean | Yes | Defaults to `true` on create when omitted. Used by BR-01 eligibility. |
| `maxThreatLevel` | integer | Yes | Must be `1`, `2`, or `3`. Covers BR-03. Used by BR-01 eligibility. |
| `currentLat` | number | Yes | Current latitude-like coordinate value. |
| `currentLng` | number | Yes | Current longitude-like coordinate value. |

### Validation Rules

- BR-02: `number` must be unique across all squads; enforced by existing PostgreSQL unique index and covered by integration tests.
- BR-03: `maxThreatLevel` must be one of `1`, `2`, or `3`; enforce through DTO validation and a versioned PostgreSQL check constraint migration.
- `captainName` must be a non-blank string.
- `currentLat` and `currentLng` must be numeric values.
- Create requires `number`, `captainName`, `maxThreatLevel`, `currentLat`, and `currentLng`; `isAvailable` may be omitted and defaults to `true`.
- Update accepts any subset of mutable fields and preserves omitted fields.

### State Transitions

| Action | State Change |
|--------|--------------|
| Create | Creates a new squad; `isAvailable` defaults to `true` if omitted. |
| Update | Changes supplied mutable fields only. |
| Remove | Sets `isAvailable` to `false`; does not delete the row. |

### Relationships

- `ThreatAlert` may reference `Squad` through the existing optional relation.
- Squad `isAvailable` and `maxThreatLevel` remain available for threat creation eligibility behavior covered by BR-01.
