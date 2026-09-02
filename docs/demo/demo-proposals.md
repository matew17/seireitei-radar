# Demo Proposals

All three options reuse the current model and are small enough to plan,
implement, and ship during a short demo.

## 1. List Eligible Squads

Add `GET /squads/available?threatLevel={level}`. It returns available squads
whose capacity is equal to or greater than the supplied threat level.

- Reuses BR-01.
- Requires no migration.
- Demonstrates a DTO, validation, controller, service, repository, and tests.

## 2. Automatically Assign a Squad

Add `POST /threat-alerts/:id/assign`. The API finds an eligible squad for the
alert, links it, and changes the alert status to `ASSIGNED`.

- Reuses `ThreatAlert.squadId`, the `Squad` relation, and `AlertStatus`.
- Requires no migration.
- The analysis must define how to select among multiple candidates and what to
  do when no candidate exists.

## Recommended Prompt for `/sdd-new`

Use this prompt without adding details. The flow should identify and resolve
the missing criteria, such as candidate selection, allowed statuses, and
expected errors.

```text
Add an API to automatically assign a squad to a threat alert based on availability and threat level.
```
