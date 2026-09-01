# Research: ThreatAlert CRUD

## Decision: Use a dedicated `threat-alerts` bounded-context module

**Rationale**: The constitution requires one NestJS module per bounded context. The existing `squads` module establishes the controller, service, repository, and DTO arrangement to follow.

**Alternatives considered**: Adding alert operations to `SquadsModule` was rejected because alert reporting is a separate bounded context.

## Decision: Enforce BR-04 in both input validation and PostgreSQL

**Rationale**: `threatLevel` is restricted to 1, 2, or 3. DTO validation gives clients a clear validation response, while a named PostgreSQL `CHECK` constraint protects direct, concurrent, and future write paths as required by the constitution.

**Alternatives considered**: Service-only validation was rejected because BR-04 is expressible as a database constraint. DTO-only validation was rejected because it does not protect non-HTTP writes.

## Decision: Perform BR-01 as an eligible-squad repository query during creation

**Rationale**: BR-01 requires querying every squad where `isAvailable` is true and `maxThreatLevel` is at least the new alert's threat level. The query belongs in the repository, is invoked by the service after creation, and does not assign a squad or mutate eligibility state.

**Alternatives considered**: Returning or assigning an eligible squad was rejected because the approved scope is eligibility lookup only. Encoding eligibility as an alert-row constraint was rejected because eligibility is an evaluated relationship, not a row-level invariant.

## Decision: Remove alerts by setting status to `RESOLVED`

**Rationale**: The existing `AlertStatus` enum supports `RESOLVED`, and the approved clarification retains resolved records in list results. The operation does not modify assignment data.

**Alternatives considered**: Hard deletion was rejected because it removes the operational record. Filtering resolved alerts from list results was rejected by the clarification.
