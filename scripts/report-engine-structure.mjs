import { readdir, readFile } from "node:fs/promises";

const engineDir = new URL("../src/logic/engine/", import.meta.url);
const files = (await readdir(engineDir)).filter((fileName) => fileName.endsWith(".js")).sort();
const topArgIndex = process.argv.indexOf("--top");
const topCount =
  topArgIndex === -1 ? null : Math.max(1, Number.parseInt(process.argv[topArgIndex + 1] ?? "8", 10) || 8);

function countMatches(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

const rows = await Promise.all(
  files.map(async (fileName) => {
    const source = await readFile(new URL(fileName, engineDir), "utf8");

    return {
      fileName,
      lines: source.split(/\r?\n/).length,
      functions: countMatches(source, /^(?:export\s+)?function\s+\w+/gm),
      exports: countMatches(source, /^export\s+/gm),
      imports: countMatches(source, /^import\s+/gm),
    };
  }),
);

const outputRows = topCount
  ? [...rows].sort((left, right) => right.lines - left.lines || left.fileName.localeCompare(right.fileName)).slice(0, topCount)
  : rows;

console.log(`engine-structure:files=${rows.length}${topCount ? `:top=${outputRows.length}` : ""}`);

outputRows.forEach((row) => {
  console.log(
    `${row.fileName}:lines=${row.lines}:functions=${row.functions}:exports=${row.exports}:imports=${row.imports}`,
  );
});
