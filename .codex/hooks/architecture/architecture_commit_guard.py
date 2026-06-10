from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


CHECKLIST_PATH = "docs/architecture-refactor-checklist.md"
WRAPPER_RE = re.compile(r"\b(?:CommitAndPush|Commit|Push)\.cmd\b", re.IGNORECASE)
DIRECT_COMMIT_RE = re.compile(r"\bgit\s+commit\b", re.IGNORECASE)
DIRECT_PUSH_RE = re.compile(r"\bgit\s+push\b", re.IGNORECASE)


def read_event() -> dict[str, Any]:
  try:
    raw = sys.stdin.read()
    if not raw.strip():
      return {}
    event = json.loads(raw)
    return event if isinstance(event, dict) else {}
  except Exception:
    return {}


def command_text(event: dict[str, Any]) -> str:
  tool_input = event.get("tool_input")
  if isinstance(tool_input, dict):
    command = tool_input.get("command")
    if isinstance(command, str):
      return command
  if isinstance(tool_input, str):
    return tool_input
  return ""


def emit(payload: dict[str, Any]) -> None:
  sys.stdout.write(json.dumps(payload, ensure_ascii=True, separators=(",", ":")))


def deny(reason: str) -> None:
  emit({
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": reason.strip(),
    },
  })


def context(message: str) -> None:
  emit({
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "additionalContext": message.strip(),
    },
  })


def git_root() -> Path:
  try:
    result = subprocess.run(
      ["git", "rev-parse", "--show-toplevel"],
      check=False,
      capture_output=True,
      text=True,
      timeout=3,
    )
    if result.returncode == 0 and result.stdout.strip():
      return Path(result.stdout.strip())
  except Exception:
    pass
  return Path.cwd()


def main() -> None:
  event = read_event()
  command = command_text(event)
  if not command:
    return

  root = git_root()
  checklist = root / CHECKLIST_PATH
  uses_wrapper = bool(WRAPPER_RE.search(command))
  direct_commit = bool(DIRECT_COMMIT_RE.search(command))
  direct_push = bool(DIRECT_PUSH_RE.search(command))

  if direct_commit or direct_push:
    deny(
      "Architecture workflow guard: direct git commit/push is blocked for this project. "
      "Use the project wrappers in .codex/project-git-workflow.md after completing "
      f"{CHECKLIST_PATH}.",
    )
    return

  if not uses_wrapper:
    return

  if not checklist.exists():
    deny(f"Architecture workflow guard: missing {CHECKLIST_PATH}. Restore it before committing code changes.")
    return

  context(
    "Architecture self-check is required before this commit. Confirm: public facades stayed stable; "
    "shared gameplay/route rules stayed in src/logic; extracted modules have focused validation; "
    "docs were updated for boundary changes; validate/report/smoke gates were run as applicable. "
    f"Checklist: {CHECKLIST_PATH}",
  )


if __name__ == "__main__":
  main()
