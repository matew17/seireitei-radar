# Quickstart: Return Threat Candidates Validation

## Prerequisites

- A PostgreSQL database configured through `DATABASE_URL` in `.env`.
- Dependencies installed with `npm install`.
- Current migrations applied with `npx prisma migrate deploy` or through the e2e pretest step.

## Validation

1. Create available capable squads, unavailable squads, and available insufficient-capability squads.
2. Run `npm test` and verify service tests named BR-01 retain and return exactly the eligible squads for creation and update requests that submit `threatLevel`.
3. Run `npm run test:e2e` and verify:
   - POST `/threat-alerts` returns the saved alert and `candidateSquads` with full Squad records.
   - PATCH `/threat-alerts/{id}` returns the same enriched response when `threatLevel` is submitted, including when it equals the saved level.
   - A location-only PATCH returns the established ThreatAlert response without `candidateSquads`.
   - Empty eligibility returns `candidateSquads: []`.
   - Invalid levels remain rejected under BR-04 without candidates.
4. Run `npm run lint` and `npm run build` to verify source quality and compilation.

## Expected Outcomes

- Candidate collections conform to [the candidate response contract](./contracts/threat-alerts.openapi.yaml) and the transient model in [data-model.md](./data-model.md).
- Candidates satisfy BR-01 and reflect the saved threat level; no candidate is persisted or assigned.
- BR-04 validation and existing PostgreSQL constraint behavior remain unchanged.
