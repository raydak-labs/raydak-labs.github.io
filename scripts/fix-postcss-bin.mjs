// Hugo requires `postcss` to be a Node.js script (checks shebang).
// pnpm installs a POSIX shell shim in node_modules/.bin/postcss, which Hugo rejects.
// Copying postcss-cli/index.js breaks relative imports (./lib/...), so write a thin
// wrapper that re-exports the real CLI entry.
import { chmodSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "node_modules", "postcss-cli", "index.js");
const dest = join(root, "node_modules", ".bin", "postcss");

if (!existsSync(cli)) {
  console.warn("fix-postcss-bin: postcss-cli missing, skip");
  process.exit(0);
}

writeFileSync(
  dest,
  `#!/usr/bin/env node
import "../postcss-cli/index.js";
`,
);
chmodSync(dest, 0o755);
console.log("fix-postcss-bin: installed Node postcss bin for Hugo");
