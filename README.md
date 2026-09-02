# Seiretei Radar

Seiretei Radar is a threat-alert API for coordinating squads across the Seiretei. It records operational squads and threat alerts, then identifies the squads capable of responding to each threat.

Built with NestJS, Prisma, and PostgreSQL.

## Purpose

The API supports two core operational workflows:

- Manage squads, including capacity, current location, captain, and availability.
- Create and manage threat alerts with a severity level and location.
- Return eligible response squads whenever a threat is created or its severity changes.

A squad is eligible for a threat when it is available and its maximum supported threat level is greater than or equal to the alert's threat level.

Threat levels:

| Level | Threat |
| --- | --- |
| `1` | Hollow |
| `2` | Menos |
| `3` | Espada |

## API

The server runs on port `3000` by default. Interactive API documentation is available at:

```text
http://localhost:3000/docs
```

### Squads

Base path: `/squads`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/squads` | Create a squad |
| `GET` | `/squads` | List all squads, including unavailable ones |
| `GET` | `/squads/:id` | Retrieve a squad |
| `PATCH` | `/squads/:id` | Partially update a squad |
| `DELETE` | `/squads/:id` | Mark a squad as unavailable |

A squad number must be unique. Deleting a squad does not remove its record; it sets `isAvailable` to `false`.

### Threat Alerts

Base path: `/threat-alerts`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/threat-alerts` | Create an alert and return eligible squads |
| `GET` | `/threat-alerts` | List alerts |
| `GET` | `/threat-alerts/:id` | Retrieve an alert |
| `PATCH` | `/threat-alerts/:id` | Update alert severity or location |
| `DELETE` | `/threat-alerts/:id` | Mark an alert as resolved |

Creating an alert returns the stored alert plus a transient `candidateSquads` collection. Updating an alert's `threatLevel` also returns candidates. Candidates are not assigned to or persisted on the alert.

## Setup

### Prerequisites

- Node.js and npm
- A running PostgreSQL instance

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the repository root:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/seiretei_radar?schema=public"
PORT=3000
```

`DATABASE_URL` is required. `PORT` is optional and defaults to `3000`.

### 3. Generate the Prisma client and apply migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

For local schema changes, create a versioned migration instead:

```bash
npx prisma migrate dev --name <migration-name>
```

### 4. Start the API

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`, with Swagger UI at `http://localhost:3000/docs`.

## Quality Checks

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

`npm run test:e2e` applies pending migrations before running the end-to-end suite.

## Agentic Development Flow

This project uses Spec Kit and OpenCode to keep implementation traceable to requirements and business rules.

```text
Feature request
  -> Specify the behavior and acceptance criteria
  -> Plan the technical approach
  -> Break the plan into scoped tasks
  -> Implement one task at a time
  -> Write tests from the specification
  -> Run quality gates
  -> Review the diff against the specification and constitution
  -> Human review and merge
```

The workflow is supported by these roles:

| Role | Responsibility |
| --- | --- |
| Specification | Defines user stories, acceptance criteria, and scope in `specs/<feature>/spec.md` |
| Planning | Records architecture, data model, research, contracts, and task breakdown |
| Implementer agent | Implements exactly one task, follows project conventions, and verifies `npm run build` |
| Test-writer agent | Writes tests from the specification and business rules without reading implementation code |
| Reviewer agent | Reviews the final diff for scope, business-rule coverage, architecture, and constitution compliance |
| Human | Makes merge decisions; direct pushes to `main` are not allowed |

The primary workflow commands are:

```text
/speckit.specify
/speckit.plan
/speckit.tasks
/speckit.implement
/speckit.analyze
```

Project-wide constraints live in:

- `.specify/memory/constitution.md`
- `docs/business-rules.md`
- `AGENTS.md`

Every business rule has a stable `BR-xx` identifier. Tests for a rule must name that identifier, and database-enforceable invariants must be implemented as PostgreSQL constraints.

## Project Structure

```text
src/
  squads/          Squad API bounded context
  threat-alerts/   Threat alert API bounded context
  prisma/          Prisma integration
  common/          Shared errors and HTTP filters
prisma/
  schema.prisma    Database schema
  migrations/      Versioned database migrations
specs/             Feature specifications and implementation plans
docs/
  business-rules.md
```
