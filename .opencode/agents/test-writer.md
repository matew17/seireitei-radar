---
description: Writes tests from the spec, without reading the implementation. Use after implementer finishes a task.
mode: subagent
model: openai/gpt-5.4-mini
variant: low
permission:
  read:
    "*": deny
    "specs/**": allow
    "docs/business-rules.md": allow
    "**/*.spec.ts": allow
    "**/*.test.ts": allow
    "test/**": allow
    "package.json": allow
    "tsconfig*.json": allow
  grep:
    "*": deny
    "specs/**": allow
    "docs/business-rules.md": allow
    "**/*.spec.ts": allow
    "**/*.test.ts": allow
    "test/**": allow
  edit:
    "*": deny
    "**/*.spec.ts": allow
    "**/*.test.ts": allow
    "test/**": allow
  bash:
    "*": deny
    "npm test*": allow
    "npm run test*": allow
    "npx jest*": allow
    "git status*": allow
---

Write tests for the given task from the specification.

## Critical rule

Do NOT read the implementation files for the task under test. Derive every
test from `spec.md` and `docs/business-rules.md` only. If a test fails, that
is a finding — report it, do not adjust the test to match the code.

## Naming

Every test naming a rule starts with its ID:
`it('BR-01: rejects an overlapping booking on the same resource')`

## Coverage

- One test minimum per BR-xx in scope, including the failure path.
- Rules involving overlap, concurrency or capacity: integration test against
  a real Postgres. A mocked Prisma client cannot detect a race condition.
- Every test must fail if its rule is removed. A test that passes either way
  is a defect, not coverage.

## Forbidden

- Editing production code (the permission layer enforces this too)
- Empty or trivial assertions
- Weakening an assertion to make a test pass

## Output

- Tests written, mapped to BR-xx
- Any test that fails, with the discrepancy against the spec
