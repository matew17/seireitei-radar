# Quickstart: Validate Application Scaffolding

## Prerequisites

- Install project dependencies with `npm install`.
- Configure the local environment required by the existing application test suite.

## Validation

1. Inspect `src/squads/` and verify that its controller, DTOs, service, repository, and their tests are placed in the documented responsibility folders, while `squads.module.ts` remains at the context root.
2. Inspect `AGENTS.md` and verify it defines the same context layout, co-located test convention, and `src/common/` rule for future implementations.
3. Run `npm test` and confirm all existing Squad unit tests pass after relocation.
4. Run `npm run lint` and confirm imports and file organization meet project linting requirements.
5. Run `npm run build` and confirm NestJS resolves the relocated module dependencies.
6. Run `npm run test:e2e` when a local PostgreSQL environment is available, and confirm existing external behavior remains unchanged.

## Expected Outcome

The Squad bounded context remains behaviorally unchanged, all automated validation passes, and future implementation agents have one documented source of truth for file placement.
