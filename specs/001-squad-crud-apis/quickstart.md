# Quickstart: Squad CRUD APIs

## Prerequisites

- PostgreSQL is available through the project environment.
- `DATABASE_URL` is configured.
- Dependencies are installed with `npm install`.

## Validation Flow

1. Apply migrations and generate Prisma client.

   ```bash
   npx prisma migrate dev --name add-squad-threat-level-check
   npx prisma generate
   ```

2. Run automated checks.

   ```bash
   npm run lint
   npm test
   npm run test:e2e
   npm run build
   ```

3. Create a squad with a new squad number.

   Expected outcome: the created squad is returned with generated `id`, provided operational fields, and default `isAvailable: true` if omitted.

4. Try to create a second squad with the same `number`.

   Expected outcome: the request is rejected with a conflict response that covers BR-02 and does not expose persistence internals.

5. Try to create or update a squad with `maxThreatLevel: 4`.

   Expected outcome: the request is rejected with a validation response that covers BR-03.

6. Retrieve the squad roster.

   Expected outcome: all squads are returned, including squads where `isAvailable` is `false`.

7. Partially update a squad's coordinates or availability.

   Expected outcome: supplied fields change and omitted fields are preserved.

8. Remove a squad.

   Expected outcome: the squad remains retrievable and appears in roster results with `isAvailable: false`.
