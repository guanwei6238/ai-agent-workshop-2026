/**
 * 問同一個問題兩次：一次不給資料，一次先檢索再給。
 *
 *   node ask.ts "期末成果發表會每組報告幾分鐘？"
 *   node ask.ts --rag "期末成果發表會每組報告幾分鐘？"
 *   node ask.ts --both "期末成果發表會每組報告幾分鐘？"
 */

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ask } from "../shared/zen-client.ts";
import { retrieveScored } from "./retrieve.ts";
import type { Backend } from "../shared/zen-client.ts";

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const backend = (argv.includes("--backend") ? argv[argv.indexOf("--backend") + 1] : undefined) as Backend | undefined;
const question = argv.filter((a) => !a.startsWith("--") && a !== backend).join(" ").trim();

if (!question) {
  console.log('用法：node ask.ts [--rag|--both] "你的問題"');
  process.exit(1);
}

/**
 * 一個空的暫存目錄。
 *
 * ⚠️ 兩邊都要用，而且原因不一樣：
 *   - `plain()`：不隔離的話，agent 會自己把手冊翻出來，你以為它「本來就知道」
 *   - `withRag()`：不隔離的話，agent 會讀到 ask.ts / retrieve.ts，
 *     發現這是一支 RAG 示範腳本，然後開始「解釋這支腳本」而不是回答問題
 *
 * 第二種是實際踩過的坑：它回了一整份手冊，最後問你「你想問哪一題？」。
 */
const emptyDir = () => mkdtempSync(join(tmpdir(), "no-context-"));

/** 兩邊共用：agent 有 grep / find，光靠空目錄還不夠，要明講。 */
const NO_TOOLS = "（直接用文字回答。不要讀取任何檔案、不要執行任何指令。）";

async function plain() {
  console.log("\n\x1b[2m── 沒有檢索 ──\x1b[0m");
  const r = await ask(
    `${question}\n\n（只用你已知的資訊回答。）${NO_TOOLS}`,
    { backend, cwd: emptyDir() },
  );
  console.log(r.text);
}

async function withRag() {
  const scored = retrieveScored(question);
  const hits = scored.map((x) => x.chunk);
  console.log("\n\x1b[2m── 有檢索 ──\x1b[0m");
  if (hits.length === 0) {
    console.log("\x1b[33m!\x1b[0m 檢索到 0 段。retrieve.ts 的 score() 還沒改吧？");
  } else {
    const shown = scored.map((x) => `${x.chunk.heading}(${x.score})`).join("、");
    console.log(`\x1b[2m檢索到 ${hits.length} 段：${shown}\x1b[0m`);
  }
  const context = hits.map((h) => h.text).join("\n\n---\n\n");
  const prompt = `以下是社團手冊的相關段落：

${context || "（沒有找到相關段落）"}

---

請只根據上面的內容回答這個問題。如果上面沒有寫，就說「手冊裡沒有寫」，不要自己推測。

只輸出答案本身。不要複述上面的段落、不要說明你做了什麼、不要反問。
${NO_TOOLS}

問題：${question}`;
  // ⚠️ cwd 一定要給 —— 不給的話 agent 會讀到這支腳本，然後開始解釋它自己。
  const r = await ask(prompt, { backend, cwd: emptyDir() });
  console.log(r.text);
}

if (flag("both")) { await plain(); await withRag(); }
else if (flag("rag")) { await withRag(); }
else { await plain(); }
