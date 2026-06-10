<!-- codex-project-git-workflow: initialized -->
<!-- initialized-at: 2026-06-01 21:01:18 +08:00 -->

# Codex Git Workflow

Initialization status: initialized
Project: TheSolitaryApex
Repository root: D:/WebProjects/TheSolitaryApex
Machine config: `
.codex\project-git-workflow.json
`
Skill: project-git-workflow

Treat this document and the machine config as the source of truth for this repository's Codex git workflow. Do not replace them with generic defaults unless the user explicitly asks to reinitialize or update the policy.

## Global Wrappers

Run these from the repository root:

```
powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Validate.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Commit.cmd -Message "commit message" -Paths path\to\file,other\file
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "commit message" -Paths path\to\file,other\file
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Push.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Stash.cmd -StashMessage "reason"
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\StashPop.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Ignore.cmd -Pattern build-output/
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\DiscardPaths.cmd -ConfirmDangerous -Paths path\to\file
```

## Status

```
powershell
git -c safe.directory=D:/WebProjects/TheSolitaryApex status --short --branch
```

## Validation

Run these before commit or push, in order:

```
cmd /c npm.cmd run check:architecture
cmd /c npm.cmd run validate
```
## Staging Policy

ask each time

Inspect status before staging. Preserve unrelated user changes unless the user explicitly asks to include them.

## Commit

Use the global wrapper's built-in git commit after staging according to policy. Prefer concise conventional commit messages unless the user specifies another message.

## Push

```
powershell
git -c safe.directory=D:/WebProjects/TheSolitaryApex push -u origin HEAD
```

## Docs And TODO

Before committing code changes, complete `docs/architecture-refactor-checklist.md`.

When module ownership, facade boundaries, validation gates, or refactor status changes, update `docs/research-and-config-roadmap.md` in the same commit.

## Safety And Branch Policy

No extra policy configured. Destructive git commands still require explicit user approval.
