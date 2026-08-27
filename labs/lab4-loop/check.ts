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

/**
 * 把註解拿掉，只留真正的程式碼。
 *
 * 沒有這個的話，agent 寫「原本是 0.3，已改成具名常數」這種註解，
 * 會被 R4 算成一次違規——遵守率的數字就虛胖了。
 * 跨行的區塊註解也要處理，所以狀態得帶著走。
 */
function stripComments(lines: string[]): string[] {
  const out: string[] = [];
  let inBlock = false;

  for (const ln of lines) {
    let res = "";
    let quote: string | null = null;   // 現在在哪一種字串裡

    for (let i = 0; i < ln.length; i++) {
      const c = ln[i];
      const next = ln[i + 1];

      if (inBlock) {
        if (c === "*" && next === "/") { inBlock = false; i++; }
        continue;
      }
      if (quote) {
        res += c;
        if (c === "\\") { res += next ?? ""; i++; }
        else if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { quote = c; res += c; continue; }
      if (c === "/" && next === "/") break;               // 行註解，整行剩下的都不要
      if (c === "/" && next === "*") { inBlock = true; i++; continue; }
      res += c;
    }
    out.push(res);
  }
  return out;
}

for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  const codeLines = stripComments(lines);

  // 追蹤「現在是不是在一個具名常數的區塊裡」。
  // 沒有這個的話，把權重抽成 const WEIGHTS = { hw: 0.3, ... } 之後，
  // 裡面每一行都會被 R4 誤判成魔術數字——規則就變成永遠滿足不了。
  let constDepth = 0;

  lines.forEach((ln, i) => {
    const n = i + 1;
    const code = codeLines[i];

    const opensConst = /^\s*(export\s+)?const\s+[A-Z][A-Z_0-9]*\s*[:=]/.test(code);
    if (opensConst) constDepth = 0;
    const inNamedConst = opensConst || constDepth > 0;
    if (opensConst || constDepth > 0) {
      constDepth += (code.match(/[{[]/g) ?? []).length;
      constDepth -= (code.match(/[}\]]/g) ?? []).length;
      if (constDepth < 0) constDepth = 0;
    }

    // R1 禁止 any
    if (/\bany\b/.test(code))
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

  // R7 匯出的函式要有完整 JSDoc：每個參數一個 @param，有回傳值就要有 @returns
  //
  // 這一條是刻意設計得「機械但囉嗦」的。模型很會寫一行摘要，
  // 但常常漏掉 @param / @returns —— 所以第一輪多半過不了，
  // 學生才看得到迴路真的在重試。
  lines.forEach((ln, i) => {
    const m = ln.match(/export\s+function\s+[A-Za-z_$][\w$]*\s*\(([^)]*)\)/);
    if (!m) return;

    // 往上收集連續的註解區塊
    const doc: string[] = [];
    for (let j = i - 1; j >= 0; j--) {
      const t = (lines[j] ?? "").trim();
      if (t.startsWith("*") || t.startsWith("/*") || t.startsWith("//")) doc.unshift(t);
      else break;
    }
    const block = doc.join("\n");

    const params = m[1]
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => x.split(/[:=?]/)[0].trim());

    // 要求標籤出現在「行首」（JSDoc 就是這樣寫的）。
    // 不然註解內文提到「別忘了 @returns」也會被當成有寫。
    const hasTag = (tag: string) =>
      new RegExp(`^\\s*\\*?\\s*${tag}\\b`, "m").test(block);

    const missing: string[] = [];
    for (const name of params) {
      if (!hasTag(`@param\\s+${name}`)) missing.push(`@param ${name}`);
    }
    // 這個檔案裡所有匯出的函式都有回傳值，所以一律要求 @returns
    if (!hasTag("@returns")) missing.push("@returns");

    if (missing.length)
      add("R7", f, i + 1, ln, `JSDoc 缺少：${missing.join("、")}。`);
  });
}

const RULES = ["R1", "R2", "R3", "R4", "R6", "R7"];
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
