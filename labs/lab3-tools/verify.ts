// 驗證：agent 有沒有真的呼叫你註冊的工具。
//
//   node verify.ts              測你自己寫的 club-tool.ts
//   node verify.ts solution     測參考解
//
// 免費模型不穩定，就算 description 寫對了也不保證每次都呼叫，
// 所以最多試 3 次，成功一次就算過。TRIES=5 node verify.ts 可以加次數。
import { join } from "node:path";
import { pi, dirOf, ok, no, dim } from "../shared/sh.ts";

const HERE = dirOf(import.meta.url);
const ext = process.argv[2] === "solution"
  ? join("..", "solution", "club-tool.ts")
  : join("..", "club-tool.ts");

const Q = "我等一下想去社辦寫 code，E205 現在方便嗎？";
const TRIES = Number(process.env.TRIES ?? 3);

console.log(`  問題：${Q}`);
console.log(`  工具：${ext}`);
console.log(`  模型：${process.env.ZEN_MODEL ?? "mimo-v2.5-free"}`);
console.log("  （一次呼叫大約 20–40 秒）\n");

for (let i = 1; i <= TRIES; i++) {
  console.log(`  ── 第 ${i} 次 ──────────────────────────`);
  const r = pi(["-e", ext, "-a", "-p", Q], {
    cwd: join(HERE, "workspace"),
    timeout: 300_000,
  });
  console.log(r.out + "\n");

  // 這三樣只存在於 club-tool.ts 的資料裡。出現 = 工具真的被呼叫了。
  const hits = ["器材長", "21:00", "3"].filter((k) => r.out.includes(k)).length;
  if (hits >= 2) {
    ok(`工具被呼叫了 —— 回答裡出現了只有工具查得到的資料（第 ${i} 次）`);
    process.exit(0);
  }
  dim("· 這次沒呼叫，再試一次\n");
}

console.log("────────────────────────────────────────");
no(`試了 ${TRIES} 次都沒呼叫工具\n`);
console.log("    它答不出「3 人 / 器材長 / 21:00」，代表它沒用你的工具。");
console.log("    最可能的原因：description 太模糊，模型不知道什麼時候該用它。");
console.log("    → 改 club-tool.ts 的 TODO 2，寫清楚「查得到什麼」與「什麼時候用」。");
console.log("      TODO 1 的名字、TODO 3 的參數說明也都是給模型看的，一起改。");
process.exit(1);
