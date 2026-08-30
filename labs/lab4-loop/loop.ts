// ════════════════════════════════════════════════════════════════
// Lab 4：一個最小可行的 loop engineering
//
//   node loop.ts "把 calc.ts 與 report.ts 依照 AGENTS.md 重構"
//
// 這支程式取代的，就是「坐在電腦前一直按 enter 的那個人」。
// 它做的事只有四步，沒有任何魔法：
//
//     ┌─────────────────────────────────────────────┐
//     │  1. 叫 agent 做事                            │
//     │  2. 用程式檢查它做出來的東西                  │
//     │  3. 過了 → 停。沒過 → 把「具體的錯誤」餵回去  │
//     │  4. 回到第 1 步（最多 MAX_RETRY 次）          │
//     └─────────────────────────────────────────────┘
//
// 對照節 2 講的「迴路的三個零件」：
//     工作從哪來    → 就這一個重構任務（命令列參數 TASK）
//     每一輪做什麼  → 改 → 跑 check.ts → 把違規清單餵回去
//     什麼時候停    → check.ts 回傳 0（全過），或重試滿 MAX_RETRY 次
//
// 三個零件裡最容易被忽略的是最後一個。少了明確的停止條件，
// 迴路要嘛永遠不停，要嘛停在你沒預期的地方。
// ════════════════════════════════════════════════════════════════

import { join } from "node:path";
import { run, runWithHeartbeat, dirOf } from "../shared/sh.ts";

const HERE = dirOf(import.meta.url);

// 要被重構的專案。預設是 Lab 2 那個成績計算工具。
const TARGET = process.env.TARGET ?? join(HERE, "..", "lab2-agents-md", "grades");
const MODEL = process.env.ZEN_MODEL ?? "mimo-v2.5-free";

// 停止條件的另一半：就算一直沒過，也不能無限跑下去。
const MAX_RETRY = Number(process.env.MAX_RETRY ?? 3);

// 每一輪的時間上限。免費模型偶爾會卡在等回應——連線還在、CPU 幾乎 0、
// 什麼都不回。實測遇過一輪跑超過 5 分鐘還沒動靜。
// 沒有這個上限，學生會盯著心跳等到下課。
const TIMEOUT = Number(process.env.TIMEOUT_SEC ?? 150) * 1000;

const TASK = process.argv[2];
if (!TASK) {
  console.error('用法：node loop.ts "你要它做的事"');
  process.exit(2);
}

/**
 * 叫 agent 做一件事。
 *
 * 這裡用 `-p`（非互動模式）是刻意的 —— 迴路要能自己跑完，
 * 中間不能停下來等人按 enter。那正是這個 lab 的重點。
 *
 * `continueSession = true` 會加上 `-c`，接續上一次的對話。
 * 這很重要：agent 因此記得自己剛剛改了什麼，
 * 你只要跟它說「這幾條沒過」，不用把整個任務重講一遍。
 */
const runAgent = (prompt: string, continueSession = false) =>
  runWithHeartbeat(
    "pi",
    [
      "--provider", "opencode", "--model", MODEL,
      ...(continueSession ? ["-c"] : []),
      "-p", prompt,
    ],
    { cwd: TARGET, label: "agent 工作中", timeout: TIMEOUT },
  );

/** 這一輪的 agent 沒跑成功時，給學生明確的下一步。 */
function explainFailure(r: { code: number; out: string; timedOut?: boolean }) {
  if (r.timedOut) {
    console.error(`
  這通常不是你的錯，是免費模型卡住了。三個選項：

  1. 直接重跑一次（最常見，通常第二次就過）

  2. 換一個模型 —— PowerShell 要先設環境變數，再下指令：

       $env:ZEN_MODEL = "laguna-s-2.1-free"
       node loop.ts "把 calc.ts 與 report.ts 依照 AGENTS.md 重構"

     （Mac / Linux：ZEN_MODEL=laguna-s-2.1-free node loop.ts "...")

  3. 把任務改小，只改一個檔、一條規則，快很多：

       node loop.ts "把 calc.ts 裡的 any 全部換成真正的型別"

  時間上限也可以調：

       $env:TIMEOUT_SEC = "300"
       node loop.ts "..."`);
  } else {
    console.error("agent 執行失敗：\n" + r.out);
  }
}

console.log(`\n目標：${TARGET}`);
console.log(`模型：${MODEL}　最多重試：${MAX_RETRY} 次　每輪上限：${TIMEOUT / 1000} 秒`);
console.log(`\n⚠️  pi 在做完之前不會有任何輸出，一輪大約 30～120 秒。`);
console.log(`   看到 ⏳ 在跳就代表還活著，不要按 Ctrl+C。\n`);

// ── 第 1 步：先讓它做一次 ────────────────────────────────────
console.log("── 第 1 次：照你說的做 ──");
const first = await runAgent(TASK);
if (first.code !== 0) {
  explainFailure(first);
  process.exit(1);
}

// ── 第 2～4 步：檢查 → 餵回去 → 再做 ─────────────────────────
for (let round = 1; round <= MAX_RETRY; round++) {
  console.log(`\n── 檢查（第 ${round} 輪）──`);

  // 這一行就是整個迴路的「回饋訊號」。
  // 訊號的品質決定迴路的品質 —— check.ts 講得越具體，agent 越修得動。
  const check = run("node", [join(HERE, "check.ts"), TARGET]);
  console.log(check.out);

  // ── 停止條件一：通過了 ──
  if (check.code === 0) {
    console.log(`\n✓ 迴路結束：第 ${round} 輪通過。`);
    process.exit(0);
  }

  // ── 停止條件二：試夠了 ──
  if (round === MAX_RETRY) {
    console.log(`\n! 試了 ${MAX_RETRY} 次還是沒過。這也是一種結果 —— 把它記下來。`);
    console.log(`  沒過的那幾條，去看看是不是「程式檢查不到」的那一類。`);
    process.exit(1);
  }

  // ── 把錯誤餵回去 ──
  // 關鍵在「具體」。餵「格式錯誤」沒有用；
  // 餵「calc.ts:15 用了 any」它才知道要改哪一行。
  // 這跟節 4 的重試迴路是完全一樣的機制，只是換了個場景。
  console.log(`\n── 把錯誤餵回去，讓它再做一次（第 ${round + 1} 次）──`);
  const feedback = `剛才的修改沒有通過專案的規範檢查，違規如下：

${check.out}

請依照 AGENTS.md 修好這些問題。只改必要的地方。`;

  const again = await runAgent(feedback, true);
  if (again.code !== 0) {
    explainFailure(again);
    process.exit(1);
  }
}
