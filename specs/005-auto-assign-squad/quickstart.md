# Quickstart: Auto-Assign Squad Validation

## Prerequisites

- PostgreSQL is available through the project's configured `DATABASE_URL`.
- Dependencies are installed.
- The feature migration has been applied with `npx prisma migrate deploy`.

## Verify Assignment

1. Create a pending threat alert at level 2.
2. Create available eligible squads with distinct numbers, including one with the lowest number.
3. Send `POST /threat-alerts/{alert-id}/assign`.
4. Verify a 200 response with `status` `ASSIGNED` and the lowest-numbered eligible `squadId`.
5. Verify the selected squad's `isAvailable` value remains true.

## Verify Rejections

1. Attempt assignment when all squads are unavailable or insufficiently capable; verify a 409 no-eligible-squad response and unchanged pending alert.
2. Attempt assignment for an assigned or resolved alert; verify a 409 response and no changed assignment.
3. Attempt assignment for a missing alert; verify a safe 404 response.
4. Directly attempt an invalid assignment through Prisma; verify the PostgreSQL constraint trigger rejects it.

## Automated Validation

Run `npm test`, `npm run test:e2e`, `npm run lint`, and `npm run build`. The e2e suite verifies database constraints using the configured PostgreSQL instance; contract tests verify the HTTP response shape and error behavior.
