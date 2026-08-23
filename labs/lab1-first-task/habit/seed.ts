/**
 * 產生種子資料。日期相對於「今天」計算，這樣 SPEC.md 裡的預期值才會固定。
 *
 *   node seed.ts
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { today, shift } from "./src/date.ts";

const d = (n: number) => shift(today(), -n);

const data = {
  habits: [
    // 今天有做，往前連續 4 天；再往前斷過
    { name: "早起", createdAt: d(30), doneOn: [d(3), d(2), d(1), d(0), d(6), d(7), d(12)].sort() },
    // 今天還沒做，但昨天與前天有 —— 用來檢查「從昨天開始算」
    { name: "讀論文", createdAt: d(20), doneOn: [d(2), d(1), d(5), d(9)].sort() },
    // 完全沒紀錄
    { name: "運動", createdAt: d(10), doneOn: [] },
  ],
};

const file = join(dirname(fileURLToPath(import.meta.url)), "habits.json");
writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log("✓ habits.json 已重設（日期相對於今天）");
