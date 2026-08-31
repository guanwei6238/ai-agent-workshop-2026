/**
 * 今天哪個免費模型能用？
 *
 *   node pick-model.ts
 *
 * ─────────────────────────────────────────────────────────────
 * 為什麼需要這支：
 *
 * OpenCode Zen 的免費模型**每天不一樣**。同一個 ID 昨天 4 秒回話，
 * 今天可能是 401（下架）、429（額度用完）、或者根本不回應。
 * 實測過的狀況全都遇過：
 *
 *   hy3-free                  401 Model not supported  ← 直接下架
 *   deepseek-v4-flash-free    400 上游錯誤
 *   nemotron-3.5-lightning    連「回兩個字」都 60 秒沒回應
 *   mimo-v2.5-free            429 FreeUsageLimitError  ← 前一天用太兇
 *
 * 所以**講義不寫死模型**。上課前跑這支，把當天能用的寫在白板上。
 * 學生卡住的時候也是跑這支，不要通靈。
 * ─────────────────────────────────────────────────────────────
 */

import { run, has, C, ok, no, tip, dim } from "./shared/sh.ts";

const PROMPT = "只回覆兩個字：可用";
const TIMEOUT = Number(process.env.PROBE_SEC ?? 45) * 1000;

if (!has("pi")) {
  no("找不到 pi。先做 Lab 0。");
  process.exit(1);
}

/** 從 pi 的型錄撈出所有免費模型（名字結尾是 -free）。 */
function freeModels(): string[] {
  const r = run("pi", ["--list-models"], { timeout: 60_000 });
  const found = new Set<string>();
  for (const line of r.out.split("\n")) {
    // 只看 opencode 這個 provider 的列
    if (!/\bopencode\b/.test(line)) continue;
    const m = line.match(/\b([a-z0-9][a-z0-9.\-]*-free)\b/i);
    if (m) found.add(m[1]);
  }
  return [...found].sort();
}

console.log(`\n══ 探測今天可用的免費模型 ══`);
dim(`每個最多等 ${TIMEOUT / 1000} 秒。全部跑完大約 1～3 分鐘。`);

const models = freeModels();
if (models.length === 0) {
  no("型錄裡找不到任何 -free 模型。");
  tip("先確認 pi 已經 /login（pi 進去打 /login，選 OpenCode Zen）");
  process.exit(1);
}
dim(`型錄裡有 ${models.length} 個：${models.join("、")}\n`);

type Row = { model: string; sec: number; okd: boolean; why: string };
const rows: Row[] = [];

for (const model of models) {
  process.stdout.write(`  ${model.padEnd(34)}`);
  const t0 = Date.now();
  const r = run(
    "pi",
    ["--provider", "opencode", "--model", model, "-p", PROMPT],
    { timeout: TIMEOUT },
  );
  const sec = Math.round((Date.now() - t0) / 1000);
  const out = r.out.replace(/\s+/g, " ").trim();

  // 把常見的錯誤翻成人看得懂的話
  let why = "";
  if (/\b401\b|not supported/i.test(out)) why = "已下架（401）";
  else if (/\b429\b|UsageLimit/i.test(out)) why = "額度用完（429）";
  else if (/\b4\d\d\b|\b5\d\d\b|error/i.test(out)) why = `上游錯誤：${out.slice(0, 50)}`;
  else if (r.code !== 0 || out === "") why = `逾時或無回應（等了 ${sec} 秒）`;

  const okd = why === "";
  rows.push({ model, sec, okd, why });
  console.log(
    okd
      ? `${C.green}可用${C.reset}  ${sec} 秒`
      : `${C.red}不通${C.reset}  ${why}`,
  );
}

const usable = rows.filter((r) => r.okd).sort((a, b) => a.sec - b.sec);

console.log(`\n══ 結果 ══`);
if (usable.length === 0) {
  no("今天沒有任何免費模型可用。");
  tip("先確認 pi 有 /login。都對的話就是 provider 整個掛了——");
  tip("Lab 5 / 6 / 7 有 --backend mock 可以離線做完，Lab 1～4 今天先用講師的畫面示範。");
  process.exit(1);
}

ok(`今天可用：${usable.length} 個。最快的是 ${C.reset}${C.green}${usable[0].model}${C.reset}（${usable[0].sec} 秒）`);
usable.forEach((r, i) => console.log(`     ${i + 1}. ${r.model.padEnd(34)} ${r.sec} 秒`));

console.log(`\n  ${C.dim}把它設起來，之後所有 lab 都會用它：${C.reset}`);
console.log(`     PowerShell：  $env:ZEN_MODEL = "${usable[0].model}"`);
console.log(`     Mac / Linux： export ZEN_MODEL=${usable[0].model}`);
if (usable[1]) {
  console.log(`\n  ${C.dim}它掛了就換第二名：${usable[1].model}${C.reset}`);
}
console.log();
