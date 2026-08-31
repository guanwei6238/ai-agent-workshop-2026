/**
 * 跑 N 次、驗證、統計。
 *
 *   node run.ts --version v1               # 預設跑 3 次
 *   node run.ts --version v2 --backend mock  # 離線，不花額度
 *   node run.ts --version v3 --n 5           # 想跑更多次就加 --n
 *
 * 結果寫到 results/<version>.json，之後用 report.ts 畫出來。
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ask, type Backend } from "../shared/zen-client.ts";
import { validate, describe } from "./validate.ts";
import type { Version } from "./prompts.ts";

// --solution 跑參考解（solution/prompts.ts），不加就跑你自己填的 prompts.ts。
// 用動態 import 是因為要在執行期才決定讀哪一份。
const useSolution = process.argv.includes("--solution");
const { buildPrompt, buildRetry } = await import(
  useSolution ? "./solution/prompts.ts" : "./prompts.ts"
);

const HERE = dirname(fileURLToPath(import.meta.url));
const MAX_RETRY = 2;

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const version = (arg("version", "v1") as Version);
const n = Number(arg("n", "3"));
const backend = arg("backend") as Backend | undefined;

const emails = readdirSync(join(HERE, "emails"))
  .filter((f) => f.endsWith(".txt"))
  .sort()
  .map((f) => ({ name: f, text: readFileSync(join(HERE, "emails", f), "utf8") }));

console.log(`版本 ${version}　次數 ${n}　backend ${backend ?? process.env.ZEN_BACKEND ?? "cli"}${useSolution ? "　\x1b[2m（參考解）\x1b[0m" : ""}`);
console.log(`測資 ${emails.length} 封，輪流使用\n`);

type Row = {
  i: number;
  email: string;
  pass: boolean;
  attempts: number;
  problems: string[];
  tokens: number;
  ms: number;
};

const rows: Row[] = [];

for (let i = 0; i < n; i++) {
  const mail = emails[i % emails.length];
  let prompt = buildPrompt(version, mail.text);
  let tokens = 0;
  let ms = 0;
  let attempts = 0;
  let problems: string[] = [];
  let pass = false;
  let last = "";

  const limit = version === "v3" ? MAX_RETRY + 1 : 1;
  for (let a = 0; a < limit; a++) {
    attempts++;
    let r;
    try {
      r = await ask(prompt, { backend, seed: i * 977, attempt: a });
    } catch (e: any) {
      problems = [`[呼叫失敗] ${e.message}`];
      break;
    }
    tokens += r.tokens;
    ms += r.ms;
    last = r.text;
    const ps = validate(r.text);
    if (ps.length === 0) { pass = true; problems = []; break; }
    problems = ps.map((x) => `${x.code}`);
    if (a < limit - 1) prompt = buildRetry(last, describe(ps));
  }

  rows.push({ i, email: mail.name, pass, attempts, problems, tokens, ms });
  const mark = pass ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
  const why = pass ? (attempts > 1 ? `（重試 ${attempts - 1} 次後過）` : "") : problems.join(", ");
  console.log(`  ${String(i + 1).padStart(2)}/${n} ${mark} ${mail.name}  ${why}`);
}

const passed = rows.filter((r) => r.pass).length;
const totalTokens = rows.reduce((a, r) => a + r.tokens, 0);

const hist: Record<string, number> = {};
for (const r of rows) for (const p of r.problems) hist[p] = (hist[p] ?? 0) + 1;

console.log(`\n── ${version} ──`);
console.log(`  通過　　　 ${passed}/${n}　(${((passed / n) * 100).toFixed(0)}%)`);
console.log(`  失敗　　　 ${n - passed}/${n}`);
console.log(`  平均 tokens ${Math.round(totalTokens / n)}　(總計 ${totalTokens})`);
if (Object.keys(hist).length) {
  console.log(`  失敗類型：`);
  for (const [k, v] of Object.entries(hist).sort((a, b) => b[1] - a[1]))
    console.log(`    ${String(v).padStart(3)} ×  ${k}`);
}

mkdirSync(join(HERE, "results"), { recursive: true });
writeFileSync(
  join(HERE, "results", `${version}.json`),
  JSON.stringify({ version, n, backend: backend ?? process.env.ZEN_BACKEND ?? "cli", passed, totalTokens, hist, rows }, null, 2),
);
console.log(`\n寫入 results/${version}.json`);
