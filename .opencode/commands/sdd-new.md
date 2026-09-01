---
description: Run the full Spec Kit analysis phase for a new feature, from one sentence to an approved task list.
---

Run the analysis phase for: $ARGUMENTS

Execute these steps in order. Stop immediately if any step reports a blocking
problem — do not continue to the next.

1. Read `.specify/memory/constitution.md` and `docs/business-rules.md`.
    1.1. Determine whether the feature introduces new business rules.

    A business rule is a domain invariant that could be violated and must be
    enforced somewhere. "Returns 200 on success" is not a rule. "No two active
    bookings may overlap" is.

    If the feature needs rules not yet in docs/business-rules.md:

    - Propose them with the next free BR-xx ids, stating where each is enforced
    - Present them to the user and STOP
    - Add them to docs/business-rules.md only after approval
    - If a proposed rule replaces an existing one, mark the old one deprecated.
    Never renumber.

    If no new rules are needed, say so and continue.

2. Read `.opencode/commands/speckit.specify.md` and follow its instructions,
   passing the feature description enriched with the BR-xx rules that apply.
   Name every applicable rule ID explicitly.

3. Read `.opencode/commands/speckit.clarify.md` and follow its instructions.
   Surface its questions to the user and STOP. Do not answer them yourself.
   Ambiguity resolved by guessing is the failure mode this whole workflow
   exists to prevent. Resume only after the user answers.

4. Read `.opencode/commands/speckit.plan.md` and follow its instructions,
   with: NestJS, Prisma, PostgreSQL, module structure per the constitution.
   Any concurrency invariant must be planned as a database constraint.

5. Read `.opencode/commands/speckit.tasks.md` and follow its instructions,
   applying this task-sizing policy:

   - Prefer cohesive, vertically complete implementation tasks over file-level
     tasks. One task may update multiple layers and files when they jointly
     deliver one behavior or structural outcome.
   - Group a behavior's DTO, repository, service, controller, and focused tests
     into one task when they are normally implemented and verified together.
   - Group related edits to the same files into one task. Never create separate
     tasks merely for individual methods, test cases, file moves, imports, or
     validation commands.
   - Keep a Prisma schema change and its required migration in the same task.
     Include its rule-named database test when that test verifies the same
     invariant.
   - Use separate tasks only for independently deliverable user stories,
     genuine dependency boundaries, materially different concerns, or work
     that can safely be implemented and committed in parallel without editing
     the same files.
   - Combine lint, test, e2e, build, contract, and quickstart verification into
     one final validation task unless one requires a distinct environment or
     remediation effort.
   - Each task must remain executable by one agent in one focused session and
     produce one coherent Conventional Commit. It must state the outcome,
     relevant files, tests, and BR-xx coverage without prescribing every edit
     as a separate subtask.
   - Before finalizing, run a consolidation pass: merge adjacent tasks that
     touch the same implementation slice or are not independently valuable.
     Do not optimize for task count, but reject granularity whose only benefit
     is tracking each file or layer separately.

6. Read `.opencode/commands/speckit.analyze.md` and follow its instructions.
   If it reports gaps or inconsistencies, report them and STOP.

7. Write the spec id to `.sdd/current-spec`.

8. Print a summary:
   - spec path
   - task count
   - BR-xx rules covered, and any rule in scope with no task
   - open questions

Then STOP. Spec approval is always human. Do not implement anything.
