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

const assets = [
  ["docs/screenshots/home-clear.png", "home-clear.png"],
  ["docs/screenshots/home-rain.png", "home-rain.png"],
  ["docs/screenshots/home-night.png", "home-night.png"],
  ["docs/screenshots/tasks.png", "tasks.png"],
  ["docs/screenshots/sleep-score.png", "sleep-score.png"],
  ["Stellise/Assets.xcassets/AppIcon.appiconset/Icon-1024.png", "app-icon.png"]
];

for (const [from, to] of assets) {
  await cp(join(root, from), join(output, "assets", to));
}

await cp(join(root, "docs", "support-manual.md"), join(output, "support-manual.md"));

console.log("Built Stellise website in dist/");
