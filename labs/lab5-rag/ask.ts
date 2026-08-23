/**
 * 問同一個問題兩次：一次不給資料，一次先檢索再給。
 *
 *   node ask.ts "期末成果發表會每組報告幾分鐘？"
 *   node ask.ts --rag "期末成果發表會每組報告幾分鐘？"
 *   node ask.ts --both "期末成果發表會每組報告幾分鐘？"
 */

import { ask } from "../shared/zen-client.ts";
import { retrieve } from "./retrieve.ts";
import type { Backend } from "../shared/zen-client.ts";

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const backend = (argv.includes("--backend") ? argv[argv.indexOf("--backend") + 1] : undefined) as Backend | undefined;
const question = argv.filter((a) => !a.startsWith("--") && a !== backend).join(" ").trim();

if (!question) {
  console.log('用法：node ask.ts [--rag|--both] "你的問題"');
  process.exit(1);
}

async function plain() {
  console.log("\n\x1b[2m── 沒有檢索 ──\x1b[0m");
  const r = await ask(question, { backend });
  console.log(r.text);
}

async function withRag() {
  const hits = retrieve(question);
  console.log("\n\x1b[2m── 有檢索 ──\x1b[0m");
  if (hits.length === 0) {
    console.log("\x1b[33m!\x1b[0m 檢索到 0 段。retrieve.ts 的 score() 還沒改吧？");
  } else {
    console.log(`\x1b[2m檢索到 ${hits.length} 段：${hits.map((h) => h.heading).join("、")}\x1b[0m`);
  }
  const context = hits.map((h) => h.text).join("\n\n---\n\n");
  const prompt = `以下是社團手冊的相關段落：

${context || "（沒有找到相關段落）"}

---

請只根據上面的內容回答這個問題。如果上面沒有寫，就說「手冊裡沒有寫」，不要自己推測。

問題：${question}`;
  const r = await ask(prompt, { backend });
  console.log(r.text);
}

if (flag("both")) { await plain(); await withRag(); }
else if (flag("rag")) { await withRag(); }
else { await plain(); }
