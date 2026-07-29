import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = fileURLToPath(new URL("./", import.meta.url));
const output = fileURLToPath(new URL("../dist/", import.meta.url));

await rm(output, { recursive: true, force: true });
await mkdir(join(output, "assets"), { recursive: true });

for (const file of await readdir(source)) {
  if (["build.mjs", "serve.mjs"].includes(file)) continue;
  await cp(join(source, file), join(output, file), {
    recursive: true
  });
}

await cp(join(root, "docs", "support-manual.md"), join(output, "support-manual.md"));

console.log("Built Stellise website in dist/");
