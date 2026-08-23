/**
 * 最笨的檢索。沒有向量、沒有資料庫，就是把文件切一切、找相關的段落。
 *
 * 你要改的只有 score()。
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

/**
 * 給一個問題和一個段落，算出「這段有多相關」。分數越高越相關，0 代表無關。
 *
 * ─────────────────────────────────────────────────────────────
 * TODO　現在這個版本笨到幾乎沒用：它只檢查「整句問題」有沒有原封不動
 *       出現在段落裡。實際上使用者不會那樣問。
 *
 *       把它改成關鍵字比對：
 *         1. 把問題切成字詞（中文可以先用 2 字為一組的滑動視窗，很粗暴但有效）
 *         2. 數有幾個出現在段落裡
 *         3. 回傳命中數
 *
 *       改完跑：node ask.ts --rag "期末成果發表會每組報告幾分鐘？"
 * ─────────────────────────────────────────────────────────────
 */
export function score(question: string, chunk: Chunk): number {
  return chunk.text.includes(question) ? 1 : 0;
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
