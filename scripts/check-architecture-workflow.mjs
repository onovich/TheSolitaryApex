import fs from "node:fs";
import path from "node:path";

const requiredFiles = [
  "docs/architecture-refactor-checklist.md",
  "docs/research-and-config-roadmap.md",
  ".codex/hooks.json",
  ".codex/hooks/architecture/architecture_commit_guard.py",
];

const requiredPackageScripts = [
  "validate",
  "validate:logic",
  "report:engine:top",
  "check:architecture",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const filePath of requiredFiles) {
  assert(fs.existsSync(filePath), `Missing architecture workflow file: ${filePath}`);
}

const packageJson = readJson("package.json");
for (const scriptName of requiredPackageScripts) {
  assert(packageJson.scripts?.[scriptName], `Missing package script: ${scriptName}`);
}

const checklist = fs.readFileSync("docs/architecture-refactor-checklist.md", "utf8");
for (const phrase of [
  "Keep public facades stable",
  "Split by real responsibility",
  "Preserve behavior while refactoring",
  "Run the right gates",
]) {
  assert(checklist.includes(phrase), `Architecture checklist is missing required item: ${phrase}`);
}

const hooksConfig = readJson(path.join(".codex", "hooks.json"));
const preToolGroups = hooksConfig.hooks?.PreToolUse ?? [];
const hasArchitectureGuard = preToolGroups.some((group) =>
  group.hooks?.some((hook) => {
    const command = `${hook.command ?? ""} ${hook.commandWindows ?? ""}`;
    return command.includes("architecture_commit_guard.py");
  }),
);

assert(hasArchitectureGuard, "Architecture commit guard hook is not registered in .codex/hooks.json");

console.log("check-architecture:ok checklist=docs/architecture-refactor-checklist.md hook=architecture_commit_guard.py");
