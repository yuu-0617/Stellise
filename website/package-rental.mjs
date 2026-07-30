import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = join(root, "dist");
const release = join(root, "rental-release");

await rm(release, { recursive: true, force: true });
await mkdir(join(release, "private"), { recursive: true });
await cp(dist, join(release, "public_html"), { recursive: true });
await cp(
  join(root, "rental-server", "stellise-secrets.example.php"),
  join(release, "private", "stellise-secrets.php")
);
await cp(
  join(root, "rental-server", "README.md"),
  join(release, "README.md")
);

console.log("Packaged rental-server files in rental-release/");
