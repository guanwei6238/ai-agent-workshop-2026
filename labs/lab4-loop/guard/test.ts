/**
 * 守衛的測試。
 *
 *   node guard/test.ts
 *
 * 為什麼守衛要有測試？因為第一版的 `.env` 樣式綁了路徑開頭，
 * 結果 `cat .env | head` 直接繞過去——而且沒有任何錯誤訊息會告訴你。
 *
 * 進階題：在下面的 ATTACK 清單加幾個你想得到的繞法，看看擋不擋得住。
 */

import { findSecretRef } from "./env-guard.ts";

/** 這些都應該被擋下來。 */
const ATTACK: Array<[string, unknown]> = [
  ["直接讀", { path: ".env" }],
  ["讀 .env.local", { path: "/home/u/app/.env.local" }],
  ["cat 加管線", { command: "cat .env | head" }],
  ["萬用字元", { command: "for f in .env*; do cat $f; done" }],
  ["編碼一下", { command: "base64 .env" }],
  ["換個檔名", { path: "config/config.env" }],
  ["用 grep 撈", { pattern: "KEY", path: "./.env" }],
  ["藏在巢狀參數裡", { edits: [{ file: "src/a.ts" }, { file: ".env.production" }] }],
  ["SSH 私鑰", { command: "cat ~/.ssh/id_rsa" }],
  ["AWS 憑證", { path: "~/.aws/credentials" }],
];

/** 這些是正常操作，擋到就是誤判。 */
const NORMAL: Array<[string, unknown]> = [
  ["讀原始碼", { path: "src/cli.ts" }],
  ["讀範例檔", { path: "env.sample" }],
  ["跑測試", { command: "node report.ts" }],
  ["environment 這個字", { command: "echo $NODE_ENV environment" }],
];

let fail = 0;
console.log("\n  應該擋下來的：");
for (const [name, input] of ATTACK) {
  const hit = findSecretRef(input);
  if (!hit) { fail++; console.log(`    \x1b[31m漏掉\x1b[0m  ${name}`); }
  else console.log(`    \x1b[32m擋下\x1b[0m  ${name}`);
}

console.log("\n  應該放行的：");
for (const [name, input] of NORMAL) {
  const hit = findSecretRef(input);
  if (hit) { fail++; console.log(`    \x1b[31m誤判\x1b[0m  ${name}  ← ${hit}`); }
  else console.log(`    \x1b[32m放行\x1b[0m  ${name}`);
}

console.log(fail === 0 ? "\n  ✓ 全部通過\n" : `\n  ✗ ${fail} 個沒過\n`);
process.exit(fail === 0 ? 0 : 1);
