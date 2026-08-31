---
description: Show current spec, task progress, blockers and run cost.
---

Report, in this order and nothing else:

1. Active spec (`.sdd/current-spec`) and current branch
2. Task progress: done / total, and the next pending task
3. `.sdd/blocked.md` if it exists — task, attempts, last finding
4. BR-xx rules with no test referencing them (grep the test files)
5. Last run summary from `.sdd/runs/`

Plain output. No suggestions unless something is blocked.
