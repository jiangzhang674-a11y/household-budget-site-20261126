/**
 * 家计本 — make.fun best-household-budget-site entrypoint (Node 22, stdlib only).
 *
 * The repository holds the finished static site under app/ and its real
 * screenshots under screenshots/. This program copies both trees into the
 * grader's output directory and writes dossier.json there with buildDossier
 * from vendor/makefun-frontend.ts (the kit's copy, byte-identical), using
 * the scorer's own caps — the same call the kit's starter main.ts makes,
 * so the grader rebuilding the dossier from its own copy of the library
 * writes byte-identical output.
 *
 *   MAKEFUN_OUTPUT_DIR=out node main.ts   # local check
 *   node main.ts                          # grader: writes /output
 *
 * Runs twice and writes the same bytes both times. No network, no
 * third-party packages: only the Node standard library plus the vendored
 * make.fun library.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const APP_DIR = join(here, "app");
const SHOTS_DIR = join(here, "screenshots");

function treeBytes(dir: string): number {
  let total = 0;
  const walk = (d: string): void => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else total += st.size;
    }
  };
  walk(dir);
  return total;
}

function main(): void {
  if (!existsSync(APP_DIR)) throw new Error("app/ is missing from the repository");
  if (!existsSync(SHOTS_DIR)) throw new Error("screenshots/ is missing from the repository");
  mkdirSync(OUT_DIR, { recursive: true });
  cpSync(APP_DIR, join(OUT_DIR, "app"), { recursive: true });
  mkdirSync(join(OUT_DIR, "screenshots"), { recursive: true });
  cpSync(SHOTS_DIR, join(OUT_DIR, "screenshots"), { recursive: true });

  // The scorer's own caps (reference/gate.json): only text_max_bytes shapes
  // the bytes; the others refuse an entry the scorer would refuse (more than
  // 4 screenshots or one over 256 KiB; more than 993 files and directories
  // in app/ or 16 MiB of app files).
  const bytes: Uint8Array = buildDossier(OUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
  writeFileSync(join(OUT_DIR, "dossier.json"), bytes);

  const shotNames = readdirSync(SHOTS_DIR).filter((n) => !n.startsWith("."));
  console.log(`app/: ${treeBytes(join(OUT_DIR, "app"))} bytes`);
  console.log(`screenshots/: ${shotNames.length} files, ${treeBytes(join(OUT_DIR, "screenshots"))} bytes`);
  console.log(`dossier.json: ${bytes.byteLength} bytes`);
}

main();
