/**
 * 規範檢查器。給 Lab 2 量遵守率、給 Lab 4 當迴路的回饋訊號。
 *
 *   node check.ts ../lab2-agents-md/grades
 *
 * 有違規時 exit code = 1，並把違規印到 stdout（迴路會把這段餵回去給模型）。
 *
 * 注意：這裡故意只實作「程式擋得住」的規則。
 * AGENTS.md 裡的 R5（註解要說明為什麼）沒有實作，也實作不了 —— 那正是重點。
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "../lab2-agents-md/grades";

interface Violation { rule: string; file: string; line: number; text: string; why: string }

// lab 的腳手架不算學生的產出，不掃。
// 少了這行，init.ts 自己會被算成違規，起始基準就對不上了。
const SCAFFOLD = new Set(["init.ts", "restore.ts"]);

const files: string[] = [];
(function walk(d: string) {
  for (const e of readdirSync(d)) {
    if (e === "node_modules" || e.startsWith(".") || SCAFFOLD.has(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".ts")) files.push(p);
  }
})(dir);

const v: Violation[] = [];
const add = (rule: string, file: string, line: number, text: string, why: string) =>
  v.push({ rule, file, line, text: text.trim().slice(0, 70), why });

for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");

  // 追蹤「現在是不是在一個具名常數的區塊裡」。
  // 沒有這個的話，把權重抽成 const WEIGHTS = { hw: 0.3, ... } 之後，
  // 裡面每一行都會被 R4 誤判成魔術數字——規則就變成永遠滿足不了。
  let constDepth = 0;

  lines.forEach((ln, i) => {
    const n = i + 1;
    const code = ln.replace(/\/\/.*$/, "");

    const opensConst = /^\s*(export\s+)?const\s+[A-Z][A-Z_0-9]*\s*[:=]/.test(code);
    if (opensConst) constDepth = 0;
    const inNamedConst = opensConst || constDepth > 0;
    if (opensConst || constDepth > 0) {
      constDepth += (code.match(/[{[]/g) ?? []).length;
      constDepth -= (code.match(/[}\]]/g) ?? []).length;
      if (constDepth < 0) constDepth = 0;
    }

    // R1 禁止 any
    if (/\bany\b/.test(code) && !/^\s*\*/.test(ln))
      add("R1", f, n, ln, "用了 any。請寫出真正的型別。");

    // R2 匯出的函式要小駝峰、動詞開頭
    const m = code.match(/export\s+function\s+([A-Za-z_$][\w$]*)/);
    if (m && /^[A-Z]/.test(m[1]))
      add("R2", f, n, ln, `函式 ${m[1]} 是大駝峰。匯出的函式要小駝峰、動詞開頭。`);

    // R3 字串組合要用 template literal
    if (/["'`][^"'`]*["'`]\s*\+\s*/.test(code) || /\+\s*["'][^"']*["']/.test(code))
      add("R3", f, n, ln, "用 + 串字串。請改成 template literal。");

    // R4 魔術數字（浮點權重、分數門檻）
    // 百分比的 * 100 / / 100 是慣用寫法，不算魔術數字
    const codeNoPercent = code.replace(/[*/]\s*100\b/g, "");
    if (
      /(?<![\w.])(0\.[1-9]\d*|[5-9]\d|100)(?![\w.])/.test(codeNoPercent) &&
      !/^\s*(import|export type)/.test(code) &&
      !inNamedConst
    ) {
      add("R4", f, n, ln, "魔術數字。權重與門檻要抽成有名字的常數。");
    }
  });

  // R6 匯出的函式上面要有說明
  lines.forEach((ln, i) => {
    if (/export\s+function\s/.test(ln)) {
      const prev = (lines[i - 1] ?? "").trim();
      if (!prev.startsWith("//") && !prev.startsWith("*") && !prev.startsWith("/*"))
        add("R6", f, i + 1, ln, "匯出的函式上面缺少一行說明。");
    }
  });
}

const RULES = ["R1", "R2", "R3", "R4", "R6"];
const counts = Object.fromEntries(RULES.map((r) => [r, v.filter((x) => x.rule === r).length]));

if (v.length === 0) {
  console.log("✓ 所有可檢查的規則都通過了。");
  console.log("  （提醒：R5「註解要說明為什麼」沒有被檢查，因為程式檢查不了。）");
  process.exit(0);
}

console.log(`✗ ${v.length} 處違規：\n`);
for (const x of v) console.log(`  ${x.rule}  ${x.file}:${x.line}\n      ${x.text}\n      → ${x.why}\n`);
console.log("各規則違規數：" + RULES.map((r) => `${r}=${counts[r]}`).join("  "));
console.log("（R5「註解要說明為什麼」無法用程式檢查，請人工看。）");
process.exit(1);
