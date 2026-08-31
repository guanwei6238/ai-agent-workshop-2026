/**
 * 守衛的測試。
 *
 *   node guard/test.ts
 *
 * 為什麼守衛要有測試？因為第一版的 `.env` 樣式綁了路徑開頭，
 * 結果 `cat .env | head` 直接繞過去——而且沒有任何錯誤訊息會告訴你。
 *
 * 這支有兩關：
 *
 *   第一關 ATTACK  守衛「應該」擋下的 —— 現在全過
 *   第二關 BYPASS  守衛「現在擋不住」的 —— 現在全紅，★ 那才是重點 ★
 *
 * 第二關會紅是**故意的**。第一關全綠只證明「它擋得住我想得到的」，
 * 不證明「它擋得住所有的」。第二關就是拿真的繞法打它 —— 每一條都實測過，
 * 在真的 shell 裡跑會把 .env 的內容原封不動印出來。
 *
 * 進階題：修 env-guard.ts 的 PROTECTED，讓第二關也變綠。
 *        改完記得回頭看第一關與 NORMAL 有沒有被你改壞（誤判也是壞）。
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

/**
 * ★ 第二關 ★ 這些**現在全部擋不住**，而且每一條實測都真的讀得到 .env。
 *
 * 共同點：它們**都沒有在字串裡寫出 `.env` 這四個字**。
 * 守衛比對的是字面，而 shell 有一百種方法把檔名組出來。
 */
const BYPASS: Array<[string, unknown]> = [
  ["glob 不寫 .env",   { command: "cat .e*" }],
  ["字元類別",         { command: "cat .[e]nv" }],
  ["問號萬用字元",     { command: "cat .en?" }],
  ["所有 dotfile",     { command: "cat .* 2>/dev/null" }],
  ["引號切斷",         { command: 'cat ".e""nv"' }],
  ["shell 變數組出來", { command: "X=.en; Y=v; cat $X$Y" }],
  ["base64 檔名",      { command: "cat $(echo LmVudg== | base64 -d)" }],
  ["find 撈出來",      { command: "find . -name '*env' -exec cat {} +" }],
  ["先 grep 檔名再讀", { command: "ls -a | grep env | xargs cat" }],
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

// ── 第二關 ─────────────────────────────────────────────────
// 這一關不算進 fail：它現在本來就是紅的，那正是這個 lab 要你看到的東西。
let leak = 0;
console.log("\n  \x1b[33m★ 第二關：這些現在擋不住 ★\x1b[0m");
for (const [name, input] of BYPASS) {
  const hit = findSecretRef(input);
  if (!hit) { leak++; console.log(`    \x1b[31m漏掉\x1b[0m  ${name}`); }
  else console.log(`    \x1b[32m擋下\x1b[0m  ${name}  ← 你補起來了`);
}

console.log(fail === 0 ? "\n  ✓ 第一關全過" : `\n  ✗ 第一關有 ${fail} 個沒過`);

if (leak > 0) {
  console.log(`  \x1b[31m✗ 第二關漏掉 ${leak} / ${BYPASS.length}\x1b[0m`);
  console.log(`
  \x1b[2m這不是壞掉，是這個 lab 的重點：
  第一關全綠，只證明「它擋得住你想得到的」。
  上面每一條在真的 shell 裡都會把 .env 原封不動印出來 ——
  因為它們都沒把「.env」這四個字寫出來，而守衛比對的是字面。

  這就是為什麼「擋住」比「拜託」難：拜託只要講清楚，
  擋住要窮舉所有繞法 —— 而你永遠不知道有沒有窮舉完。

  進階題：改 env-guard.ts 的 PROTECTED 讓第二關變綠，
        然後回頭確認第一關與「應該放行」沒有被你改壞。\x1b[0m
`);
} else {
  console.log(`  \x1b[32m✓ 第二關也全過 —— 你把洞補起來了\x1b[0m\n`);
}

process.exit(fail === 0 ? 0 : 1);
