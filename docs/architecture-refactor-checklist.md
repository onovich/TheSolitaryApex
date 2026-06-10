# Architecture Refactor Checklist

Use this checklist before committing code changes. It is intentionally short; deeper module inventory stays in `docs/research-and-config-roadmap.md`.

## Required Before Commit

- Keep public facades stable. UI and hooks should keep importing from existing facade modules unless the facade itself is the thing being changed.
- Split by real responsibility. Extract behavior only when it removes mixed concerns, meaningful duplication, or a top-level orchestration burden.
- Keep shared rules in shared logic. Gameplay rules, route generation, runtime adapters, and snapshot contracts belong under `src/logic/*`; UI layers should stay thin.
- Preserve behavior while refactoring. Add or extend a focused validator for each extracted contract before trusting the move.
- Keep changes narrow. Do not mix feature design, tuning, visual redesign, and architecture cleanup in one commit unless they are inseparable.
- Update the handoff docs when module ownership changes. Most engine boundary updates belong in `docs/research-and-config-roadmap.md`.
- Run the right gates. For engine refactors run `npm run validate:logic`, `npm run report:engine:top`, then `npm run validate` before commit.
- Smoke visible changes. If UI, canvas, input, or layout behavior can change, capture a local browser screenshot.

## Commit Workflow

- Use the project git wrappers from `.codex/project-git-workflow.md`; direct `git commit` and direct `git push` are blocked by the project architecture hook.
- Before running `Commit.cmd` or `CommitAndPush.cmd`, read the checklist above and make sure each item is satisfied or explicitly not applicable.
- The hook is a guardrail, not a substitute for judgment: if a change crosses module boundaries, add the smallest focused validation that proves the boundary still holds.
