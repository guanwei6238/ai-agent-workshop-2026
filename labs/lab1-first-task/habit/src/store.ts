/**
 * 資料存取一律走這裡，其他檔案不直接碰檔案系統。
 * 資料檔預設放在專案根目錄的 habits.json。
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { DateString } from "./date.ts";

export interface Habit {
  name: string;
  createdAt: DateString;
  /** 已完成的日期，遞增排序，不重複 */
  doneOn: DateString[];
}

export interface Data {
  habits: Habit[];
}

const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "habits.json");

export function load(): Data {
  if (!existsSync(FILE)) return { habits: [] };
  return JSON.parse(readFileSync(FILE, "utf8")) as Data;
}

export function save(data: Data): void {
  writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
}

/** 找一個習慣。找不到回 undefined，要不要抱怨由呼叫端決定。 */
export function find(data: Data, name: string): Habit | undefined {
  return data.habits.find((h) => h.name === name);
}
