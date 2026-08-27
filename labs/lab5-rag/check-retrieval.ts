/**
 * 檢查檢索有沒有撈到正確的段落。不呼叫模型，秒回。
 *
 *   node check-retrieval.ts
 *
 * 對四個題目跑一次檢索，看正確的段落有沒有排進前 2。
 * 不用呼叫模型，秒回。
 */
import { retrieveScored } from "./retrieve.ts";

const CASES: Array<[string, string]> = [
  ["期末成果發表會每組報告幾分鐘？", "期末成果發表會"],
  ["器材可以借幾天？", "器材借用"],
  ["社辦鑰匙有幾副？", "社辦鑰匙"],
  ["單筆支出超過多少要開社員大會？", "經費"],
];

let fail = 0;
console.log();
for (const [q, expect] of CASES) {
  const hits = retrieveScored(q);
  const ok = hits.some((h) => h.chunk.heading.includes(expect));
  const detail = hits.length
    ? hits.map((h) => `${h.chunk.heading}(${h.score})`).join("、")
    : "（沒檢索到任何段落）";
  console.log(`  ${ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${q}`);
  console.log(`      ${detail}`);
  if (!ok) fail++;
}
console.log();
if (fail === 0) {
  console.log("  四題都檢索到正確的段落了。");
  console.log("  \x1b[2m注意看分數：有沒有哪一題，正確的跟錯誤的分數一樣高？\x1b[0m");
} else {
  console.log(`  ${fail} 題沒檢索到。`);
  console.log(`  如果四題全部沒撈到，去看 retrieve.ts 的 MODE 是不是設成 "naive"。`);
}
console.log();
process.exit(fail);
