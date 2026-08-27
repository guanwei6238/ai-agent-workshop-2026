/**
 * 把 results/ 裡的結果畫出來。
 *
 *   node report.ts
 *
 * 會印出 ASCII 對照表，並產生 chart.svg（可以直接貼進報告或投影片）。
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** 中日韓字元在終端機佔兩格，padEnd 不知道這件事。 */
const width = (s: string) => [...s].reduce((n, c) => n + (/[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(c) ? 2 : 1), 0);
const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - width(s)));
const ORDER = ["v1", "v2", "v3"];
const LABEL: Record<string, string> = {
  v1: "v1 爛 prompt",
  v2: "v2 + schema + 反例",
  v3: "v3 + 重試迴路",
};

const data = ORDER.map((v) => {
  const f = join(HERE, "results", `${v}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}).filter(Boolean) as any[];

if (data.length === 0) {
  console.log("results/ 是空的。先跑 node run.ts --version v1");
  process.exit(1);
}

// 三次跑的條件必須一樣，不然畫出來的圖是假的而你看不出來。
const ns = [...new Set(data.map((d) => d.n))];
const backends = [...new Set(data.map((d) => d.backend ?? "?"))];
if (ns.length > 1 || backends.length > 1) {
  console.log("\n  \x1b[31m✗ 三次跑的條件不一樣，這張圖沒有意義\x1b[0m");
  for (const d of data) console.log(`      ${d.version}: n=${d.n}  backend=${d.backend ?? "?"}`);
  console.log("\n  用同樣的 --n 與同樣的 backend 重跑，再回來畫圖。\n");
  process.exit(1);
}

console.log("\n  版本                  通過率            平均 tokens");
console.log("  " + "─".repeat(56));
for (const d of data) {
  const rate = d.passed / d.n;
  const bar = "█".repeat(Math.round(rate * 24)).padEnd(24, "░");
  const pct = `${(rate * 100).toFixed(0)}%`.padStart(4);
  console.log(
    `  ${pad(LABEL[d.version], 24)}${bar} ${pct}   ${String(Math.round(d.totalTokens / d.n)).padStart(6)}`,
  );
}

console.log("\n  失敗類型（次數）");
console.log("  " + "─".repeat(56));
const codes = [...new Set(data.flatMap((d) => Object.keys(d.hist)))];
if (codes.length === 0) console.log("  （沒有失敗）");
else {
  console.log("  " + pad("類型", 28) + data.map((d) => d.version.padStart(6)).join(""));
  for (const c of codes.sort())
    console.log("  " + pad(c, 28) + data.map((d) => String(d.hist[c] ?? 0).padStart(6)).join(""));
}

// 成本換算：把平均 tokens 乘上你自己的單價
const last = data[data.length - 1];
console.log(
  `\n  成本感：${LABEL[last.version]} 平均 ${Math.round(last.totalTokens / last.n)} tokens/次。` +
    `\n  假設 1000 個使用者、每人每天用 10 次 → 每月約 ` +
    `${((last.totalTokens / last.n) * 10 * 1000 * 30 / 1_000_000).toFixed(1)}M tokens。` +
    `\n  乘上你要用的模型單價，那就是這個功能一個月的錢。`,
);

// ── SVG ──
const W = 640, H = 300, PAD = 56;
const bw = (W - PAD * 2) / data.length;
const bars = data
  .map((d, i) => {
    const rate = d.passed / d.n;
    const h = Math.round((H - PAD * 2) * rate);
    const x = PAD + i * bw + bw * 0.2;
    const w = bw * 0.6;
    const y = H - PAD - h;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#1D4ED8"/>
<text x="${x + w / 2}" y="${y - 8}" text-anchor="middle" font-size="14" fill="#1C1C1A">${(rate * 100).toFixed(0)}%</text>
<text x="${x + w / 2}" y="${H - PAD + 20}" text-anchor="middle" font-size="12" fill="#767672">${d.version}</text>`;
  })
  .join("\n");

writeFileSync(
  join(HERE, "chart.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="sans-serif">
<rect width="${W}" height="${H}" fill="#FCFCFB"/>
<text x="${PAD}" y="30" font-size="16" font-weight="bold" fill="#1C1C1A">prompt 版本 vs 通過率</text>
<line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="#DEDEDA"/>
${bars}
</svg>`,
);
console.log(`\n  已寫出 chart.svg —— 這張圖就是本課的結論。\n`);
