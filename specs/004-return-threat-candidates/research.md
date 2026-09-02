# Research: Return Threat Candidates

## Decision: Reuse the existing eligibility query for response composition

**Rationale**: `ThreatAlertsRepository.findEligibleSquads(threatLevel)` already expresses BR-01 by selecting available squads whose maximum threat level is sufficient. The service should retain its returned squads and compose them with the saved threat rather than discard the result.

**Alternatives considered**: Duplicating the eligibility predicate in the service or controller was rejected because Prisma access belongs in the repository. Persisting candidates or adding a threat-to-candidate relationship was rejected because candidates are an action-time result, not an assignment or new data relationship.

## Decision: Query candidates after a successful persistence operation

**Rationale**: Creation and severity-submitting updates must return candidates for the saved threat level. Running the lookup after the create or update ensures the response reflects the persisted severity, including an update that submits the same severity. A location-only update returns the established ThreatAlert response without an eligibility lookup.

**Alternatives considered**: Querying before persistence was rejected because it can return candidates for a severity that failed to save. Looking up candidates only when the numeric level changes was rejected by clarification: a submitted valid level always requires candidates.

## Decision: Use a dedicated response type without changing persistence models

**Rationale**: `candidateSquads` is transient response data, while the Prisma `ThreatAlert` model has no candidate relationship. A service-level response type can combine the complete existing `Squad` representation with the persisted ThreatAlert without a schema change.

**Alternatives considered**: Adding `candidateSquads` to the Prisma schema was rejected because it would incorrectly persist an evaluated response. Returning only squad IDs or a reduced projection was rejected by clarification in favor of the full established squad representation.

## Decision: Extend only the create and conditional update contracts

**Rationale**: The feature explicitly limits enriched responses to POST and PATCH requests that submit `threatLevel`. List, get, removal, and location-only updates retain their existing ThreatAlert schemas, avoiding an unintended API-wide contract change.

**Alternatives considered**: Adding candidates to every ThreatAlert response was rejected as out of scope. Omitting `candidateSquads` when empty was rejected because callers need an explicit empty result.
