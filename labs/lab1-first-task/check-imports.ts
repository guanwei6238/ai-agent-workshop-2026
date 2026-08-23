/**
 * 找出沒被用到的 import。
 *
 *   node check-imports.ts habit/src/commands/streak.ts
 *
 * 有沒用到的就 exit 1 並印出名字。
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) { console.error("用法：node check-imports.ts <檔案>"); process.exit(2); }

const src = readFileSync(file, "utf8");
const names = [...src.matchAll(/import\s*\{([^}]*)\}/g)]
  .flatMap((m) => m[1].split(","))
  .map((n) => n.trim().split(/\s+as\s+/).pop()!.trim())
  .filter(Boolean);

const body = src.replace(/^\s*import[^\n]*\n/gm, "");
const unused = names.filter((n) => !new RegExp(`\\b${n}\\b`).test(body));

if (unused.length) { console.log(unused.join(", ")); process.exit(1); }
process.exit(0);
