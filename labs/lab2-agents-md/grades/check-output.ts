// 確認重構之後「功能沒被改壞」——報表輸出要跟 baseline.txt 一模一樣。
//
//   node check-output.ts
//
// 不用你讀 diff，一行 ✓ 或 ✗。
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { run, dirOf, ok, no, dim } from "../../shared/sh.ts";

const HERE = dirOf(import.meta.url);
const BASE = join(HERE, "baseline.txt");

if (!existsSync(BASE)) {
  no("找不到 baseline.txt —— 先跑 node init.ts");
  process.exit(2);
}

const expected = readFileSync(BASE, "utf8").trim();
const actual = run("node", ["report.ts"], { cwd: HERE }).out.trim();

if (actual === expected) {
  ok("報表輸出跟重構前一模一樣 —— 功能沒被改壞");
  process.exit(0);
}

no("報表輸出跟重構前不一樣 —— 功能被改壞了");
console.log();
const e = expected.split("\n");
const a = actual.split("\n");
for (let i = 0; i < Math.max(e.length, a.length); i++) {
  if (e[i] === a[i]) continue;
  console.log(`  第 ${i + 1} 行`);
  console.log(`    重構前：${e[i] ?? "（沒有這一行）"}`);
  console.log(`    現在　：${a[i] ?? "（沒有這一行）"}`);
}
console.log();
dim("在 VS Code 裡開 calc.ts / report.ts，看它把哪裡算錯了。");
process.exit(1);
