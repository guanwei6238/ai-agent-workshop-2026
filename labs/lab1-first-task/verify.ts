// 檢查 agent 做出來的 streak 指令有沒有符合 SPEC.md。
//
//   node verify.ts
//
// 每一項都是可以自己跑的檢查，不用憑感覺判斷。
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { run, dirOf, ok, no, C } from "../shared/sh.ts";

const HABIT = join(dirOf(import.meta.url), "habit");
const SRC = join(HABIT, "src", "commands", "streak.ts");

let pass = 0;
let fail = 0;
function check(desc: string, good: boolean, detail = "") {
  if (good) { ok(desc); pass++; }
  else { no(desc); if (detail) console.log(`      ${C.dim}${detail}${C.reset}`); fail++; }
}

run("node", ["seed.ts"], { cwd: HABIT });
const r = run("node", [join("src", "cli.ts"), "streak"], { cwd: HABIT });
const out = r.out;

console.log("\n── 使用方法 ──");
check("不給參數就能跑，不報錯", r.code === 0, out);

console.log("── 輸出內容 ──");
for (const h of ["早起", "讀論文", "運動"]) check(`列出了「${h}」`, out.includes(h));

console.log("── 邊界 ──");
check("早起 = 4（今天有做）", /早起.*\b4\b/.test(out), out);
check("讀論文 = 2（今天沒做，從昨天算）", /讀論文.*\b2\b/.test(out), out);
check("運動 = 0（完全沒紀錄）", /運動.*\b0\b/.test(out), out);

console.log("── 沒有多做 ──");
let extra = /最長/.test(out);
if (existsSync(SRC)) {
  // 只看程式碼，不看註解——註解裡寫「不是最長連續」不算多做
  const code = readFileSync(SRC, "utf8")
    .split("\n")
    .filter((l) => !/^\s*(\/\*|\*)/.test(l))
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n");
  if (/最長|longest/i.test(code)) extra = true;
}
check("沒有算「最長連續」", !extra, "輸出或原始碼裡出現了「最長 / longest」");

console.log("── 有沒有跟上專案寫法 ──");
if (existsSync(SRC)) {
  const code = readFileSync(SRC, "utf8");
  const cli = readFileSync(join(HABIT, "src", "cli.ts"), "utf8");
  check("開在 src/commands/ 底下", true);
  check("有在 cli.ts 註冊", cli.includes("streak"));
  check("用 ui.ts 的函式，沒有直接 console.log", !/console\.log/.test(code));
  check("用 date.ts 的 helper", /shift|diffDays/.test(code));
  check("沒有用 any", !/\bany\b/.test(code));
  const unused = run("node", [join(dirOf(import.meta.url), "check-imports.ts"), SRC]).out;
  check("沒有沒用到的 import", unused === "", `沒用到：${unused}`);
} else {
  check("開在 src/commands/streak.ts", false, "找不到這個檔");
}

console.log(`\n  ${pass} 項通過，${fail} 項沒過`);
console.log(fail === 0 ? "  全部符合規格。\n" : "  把沒過的那幾項記到檢核表上。\n");
process.exit(fail);
