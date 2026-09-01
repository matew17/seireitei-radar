# Quickstart: ThreatAlert CRUD Validation

## Prerequisites

- A PostgreSQL database configured through `DATABASE_URL` in `.env`.
- Dependencies installed with `npm install`.
- The feature migration applied through the e2e pretest step or `npx prisma migrate dev` in local development.

## Validation

1. Run `npm test` to execute DTO, repository, service, controller, and BR-01 behavior tests.
2. Run `npm run test:e2e` against PostgreSQL to execute ThreatAlert HTTP and contract tests, including the BR-04 database-constraint test.
3. Run `npm run lint` and `npm run build` to verify source quality and compilation.

## Expected Outcomes

- Valid creates persist a pending, unassigned alert and execute the eligible-squad lookup described in [data-model.md](./data-model.md).
- Invalid threat levels are rejected by the API and database under BR-04.
- Alert retrieval, partial severity/location corrections, and removal-as-resolved conform to [the API contract](./contracts/threat-alerts.openapi.yaml).
- Resolved alerts remain in list results; no endpoint assigns a squad or changes alert status other than removal.
