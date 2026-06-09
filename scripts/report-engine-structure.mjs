import { readdir, readFile } from "node:fs/promises";

const engineDir = new URL("../src/logic/engine/", import.meta.url);
const files = (await readdir(engineDir)).filter((fileName) => fileName.endsWith(".js")).sort();

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

console.log(`engine-structure:files=${rows.length}`);

rows.forEach((row) => {
  console.log(
    `${row.fileName}:lines=${row.lines}:functions=${row.functions}:exports=${row.exports}:imports=${row.imports}`,
  );
});
