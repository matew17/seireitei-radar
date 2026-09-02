# Data Model: Return Threat Candidates

## Persisted Entities

No persisted data-model changes are required.

### ThreatAlert

The existing ThreatAlert retains its identity, threat level, coordinates, status, optional assigned squad reference, and creation time. BR-04 continues to restrict `threatLevel` to 1, 2, or 3 through DTO validation and the existing PostgreSQL check constraint.

### Squad

The existing Squad retains its full established representation: `id`, `number`, `captainName`, `isAvailable`, `maxThreatLevel`, `currentLat`, and `currentLng`.

## Transient Response Model

### ThreatAlertWithCandidateSquads

Used only for a successful threat creation or a successful update request that submits `threatLevel`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Existing ThreatAlert fields | Existing ThreatAlert representation | Yes | The saved alert returned by the existing create or update operation. |
| `candidateSquads` | array of full Squad representations | Yes | Empty when no Squad meets BR-01. |

### Eligibility Rule

- BR-01: Each `candidateSquads` entry has `isAvailable` true and `maxThreatLevel` greater than or equal to the saved ThreatAlert `threatLevel`.
- BR-04: The create or update request's `threatLevel`, when present, must be 1, 2, or 3 before an enriched response is returned.

### Lifecycle

| Action | Persistence | Response |
|--------|-------------|----------|
| Create valid threat | Creates ThreatAlert | ThreatAlert with `candidateSquads` calculated for its saved level. |
| Update with `threatLevel` | Updates supplied alert fields | ThreatAlert with `candidateSquads` calculated for its saved level, including an unchanged submitted level. |
| Location-only update | Updates supplied location fields | Existing ThreatAlert representation only. |
| Invalid create or update level | No valid level persisted | Existing validation error; no candidate result. |
