---

description: "Task list for Return Threat Candidates"
---

# Tasks: Return Threat Candidates

**Input**: Design documents from `/specs/004-return-threat-candidates/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/threat-alerts.openapi.yaml](./contracts/threat-alerts.openapi.yaml), [quickstart.md](./quickstart.md)

**Tests**: Focused service, e2e, and HTTP contract tests are required by the feature and constitution rule traceability.

**Organization**: The P1 create response and P2 severity-submitting update response share the same response type and implementation slice. They are intentionally delivered together in one cohesive task rather than split by file, method, or test type.

## Phase 1: Candidate Response Behavior (User Stories 1 and 2)

**Goal**: Return complete eligible squads in `candidateSquads` on threat creation and on any valid update that submits `threatLevel`, while preserving the current location-only update response.

**Independent Test**: Seed eligible, unavailable, and insufficient-capability squads; verify POST and severity-submitting PATCH return exactly the full eligible squad records, including `[]` when none qualify, and verify location-only PATCH omits `candidateSquads`.

- [ ] T001 [US1] [US2] Deliver the `candidateSquads` response contract across `src/threat-alerts/repositories/threat-alerts.repository.ts`, `src/threat-alerts/services/threat-alerts.service.ts`, and `src/threat-alerts/controllers/threat-alerts.controller.ts`; add focused BR-01 and BR-04 service coverage in `src/threat-alerts/services/threat-alerts.service.spec.ts`; update create, severity-submitting update, location-only update, empty-result, and full-squad response coverage in `test/threat-alerts.e2e-spec.ts` and `test/threat-alerts.contract.e2e-spec.ts`. Covers BR-01 and BR-04. Outcome: one conventional commit, `feat(threat-alerts): return candidate squads`.

**Checkpoint**: Both create and severity-submitting update flows return the approved full squad representation under `candidateSquads`; no candidate data is persisted, and location-only updates retain their existing response.

---

## Phase 2: Final Validation

**Purpose**: Verify the complete implementation against the documented contract and project quality gates.

- [ ] T002 Run the [quickstart validation](./quickstart.md) using `npm test`, `npm run test:e2e`, `npm run lint`, and `npm run build`; confirm the HTTP results conform to `specs/004-return-threat-candidates/contracts/threat-alerts.openapi.yaml`, BR-01 has named candidate-selection coverage, and BR-04 validation and real-PostgreSQL constraint coverage remain passing. Covers BR-01 and BR-04. Outcome: recorded validation results with no source changes.

---

## Dependencies & Execution Order

1. T001 delivers the complete shared implementation slice for User Stories 1 and 2.
2. T002 depends on T001 and validates both stories together.

## Parallel Opportunities

No safe parallel implementation tasks are identified. Both user stories intentionally touch the same response types, service, controller, and e2e suites; splitting them would create merge conflicts and weaken the coherent response-contract commit.

## Implementation Strategy

1. Complete T001 as one vertical behavior change with its focused tests and one Conventional Commit.
2. Complete T002 as the final combined quality-gate and quickstart validation.
