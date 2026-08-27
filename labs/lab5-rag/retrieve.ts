/**
 * 最笨的檢索。沒有向量、沒有資料庫，就是把文件切一切、找相關的段落。
 *
 * 整份都寫好了，你不用寫程式。要比較兩種做法就改 MODE 那一行。
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

export interface Chunk {
  source: string;
  heading: string;
  text: string;
}

/** 依 markdown 的二級標題切塊。這一步已經寫好了。 */
export function loadChunks(dir = join(HERE, "knowledge")): Chunk[] {
  const out: Chunk[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const raw = readFileSync(join(dir, f), "utf8");
    const parts = raw.split(/\n(?=## )/);
    for (const p of parts) {
      const heading = (p.match(/^#{1,2}\s*(.+)$/m)?.[1] ?? "(無標題)").trim();
      if (p.trim()) out.push({ source: f, heading, text: p.trim() });
    }
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
//  檢索的核心：給一個問題和一個段落，算出「這段有多相關」。
//  分數越高越相關，0 代表無關。
//
//  ★ 你不用寫程式。這裡有兩個版本，都已經寫好了。
//    改下面這一行就能切換，然後比較兩者的差別。
// ══════════════════════════════════════════════════════════════

/** 改成 "naive" 就換成笨版本，看它多沒用。 */
const MODE: "keyword" | "naive" = "keyword";

/**
 * 版本 A：最笨的比對。
 *
 * 檢查「整句問題」有沒有原封不動出現在段落裡。
 * 問題是：使用者不會那樣問。你問「每組報告幾分鐘？」，
 * 手冊裡寫的是「每組報告時間 8 分鐘」——一個字都對不上，
 * 所以永遠回 0，什麼都撈不到。
 */
function scoreNaive(question: string, chunk: Chunk): number {
  return chunk.text.includes(question) ? 1 : 0;
}

/**
 * 版本 B：關鍵字比對。實際在用的就是這個。
 *
 * 中文沒有空格，沒辦法用 split(" ") 斷詞。真的斷詞要套 jieba
 * 那類工具，太重了。所以這裡用最粗暴的辦法：
 *
 *   1. 把問題切成「2 個字一組」的滑動視窗
 *      「報告幾分鐘」→ 報告、告幾、幾分、分鐘
 *   2. 去掉重複的，然後數有幾組出現在這個段落裡
 *   3. 命中數就是分數
 *
 * 粗暴，但對中文意外地有效。而且它讓你看到：
 * 檢索沒有魔法，就是在數字面上的命中。
 */
function scoreKeyword(question: string, chunk: Chunk): number {
  const grams: string[] = [];
  for (let i = 0; i < question.length - 1; i++) {
    const gram = question.slice(i, i + 2);
    if (!/[\s，。？?、]/.test(gram)) grams.push(gram);   // 跳過標點
  }
  const unique = [...new Set(grams)];
  return unique.filter((g) => chunk.text.includes(g)).length;
}

export function score(question: string, chunk: Chunk): number {
  return MODE === "naive" ? scoreNaive(question, chunk) : scoreKeyword(question, chunk);
}

/** 取分數最高的前 k 段，連分數一起回傳（分數會讓你看到「兩段同分」這種事）。 */
export function retrieveScored(
  question: string,
  k = 2,
  chunks = loadChunks(),
): Array<{ chunk: Chunk; score: number }> {
  return chunks
    .map((c) => ({ chunk: c, score: score(question, c) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/** 只要段落、不要分數的版本。 */
export function retrieve(question: string, k = 2, chunks = loadChunks()): Chunk[] {
  return retrieveScored(question, k, chunks).map((x) => x.chunk);
}
