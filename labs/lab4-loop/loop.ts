// Lab 4：最小可行的 loop engineering。
//
//   node loop.ts "把 calc.ts 與 report.ts 依照 AGENTS.md 重構"
//
// 做 → 檢查 → 把錯誤餵回去 → 再做。就這樣，沒有魔法。
import { join } from "node:path";
import { run, runLive, dirOf } from "../shared/sh.ts";

const HERE = dirOf(import.meta.url);
const TARGET = process.env.TARGET ?? join(HERE, "..", "lab2-agents-md", "grades");
const MODEL = process.env.ZEN_MODEL ?? "nemotron-3.5-lightning-free";
const MAX_RETRY = Number(process.env.MAX_RETRY ?? 3);

const TASK = process.argv[2];
if (!TASK) {
  console.error('用法：node loop.ts "你要它做的事"');
  process.exit(2);
}

// 用 runLive，這樣學生看得到 agent 正在做什麼
const runAgent = (prompt: string, cont = false) =>
  runLive("pi", [
    "--provider", "opencode", "--model", MODEL,
    ...(cont ? ["-c"] : []), "-p", prompt,
  ], { cwd: TARGET });

console.log("── 第 1 次：照你說的做 ──");
if (runAgent(TASK) !== 0) {
  console.error("agent 執行失敗");
  process.exit(1);
}

for (let i = 1; i <= MAX_RETRY; i++) {
  console.log(`\n── 檢查（第 ${i} 輪）──`);
  const check = run("node", [join(HERE, "check.ts"), TARGET]);
  console.log(check.out);

  if (check.code === 0) {
    console.log(`\n✓ 迴路結束：第 ${i} 輪通過。`);
    process.exit(0);
  }

  if (i === MAX_RETRY) {
    console.log(`\n! 試了 ${MAX_RETRY} 次還是沒過。這也是一種結果——把它記下來。`);
    process.exit(1);
  }

  console.log(`\n── 把錯誤餵回去（第 ${i + 1} 次）──`);
  // 關鍵在這裡：餵回去的必須是「具體的」錯誤，不是「格式錯誤」四個字。
  const fed = `剛才的修改沒有通過專案的規範檢查，違規如下：

${check.out}

請依照 AGENTS.md 修好這些問題。只改必要的地方。`;
  if (runAgent(fed, true) !== 0) process.exit(1);
}
