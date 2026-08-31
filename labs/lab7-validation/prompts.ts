/**
 * 三個版本的 prompt。你這個 Lab 只需要改這個檔案。
 *
 *   v1  最爛的版本。基準線。
 *   v2  ← 你要填的。加上 schema 與反例。
 *   v3  = v2 + 失敗時把錯誤訊息餵回去重試（重試邏輯在 run.ts，不用你寫）
 */

export type Version = "v1" | "v2" | "v3";

// ────────────────────────────────────────────────────── v1：基準線

const V1 = (email: string) => `幫我從這封信裡把訂單資料整理成 JSON。

${email}`;

// ────────────────────────────────────────────────────── v2：你要填的

/**
 * TODO(1)　把下面這份 schema 貼進 prompt。給 schema 比用文字描述欄位有效得多。
 * TODO(2)　加一個「錯誤示範」——講清楚錯在哪、為什麼錯。一個反例抵三段規則。
 * TODO(3)　明確禁止多餘輸出（code fence、開場白、解釋）。
 *
 * 填完之後跑：node run.ts --version v2
 * 如果失敗率沒有比 v1 低，先看 report 裡的「失敗類型」——
 * 是哪一類沒被你的 prompt 處理到？
 */
const SCHEMA = `{
  "order_id":  string,
  "customer":  string,
  "currency":  "TWD" | "USD" | "JPY",
  "items":     [{ "name": string, "unit_price": number, "qty": number }],
  "subtotal":  number,
  "discount":  number,
  "total":     number,
  "status":    "pending" | "shipped",
  "tracking_no": string（status 為 shipped 時必填）,
  "order_date": string（YYYY-MM-DD）,
  "ship_by":    string（YYYY-MM-DD）
}`;

const V2 = (email: string) => `幫我從這封信裡把訂單資料整理成 JSON。

請完全依照這個 schema：

${SCHEMA}

錯誤示範（不要這樣做）——反例：

\`\`\`json
{
  "order_id": "PO-20260901-014",
  "customer": "資工系學會",
  "currency": "NTD",
  "items": [{ "name": "藍色原子筆", "unit_price": 25, "qty": 12 }],
  "subtotal": 300,
  "discount": 50,
  "total": 300,
  "status": "pending",
  "order_date": "2026-09-01",
  "ship_by": "2026-09-05"
}
\`\`\`

它壞在哪：
1. currency 寫成 "NTD"，但 schema 只允許 "TWD" | "USD" | "JPY"（新台幣請用 TWD）
2. 包了 markdown code fence（\`\`\`），導致 JSON.parse 失敗
3. 算術錯誤：total 應該是 subtotal - discount = 300 - 50 = 250，不是 300。每次輸出前請自己把 items 重新加總驗算 subtotal，再算一次 total = subtotal - discount
4. 前面還多了開場白文字，也會造成驗證失敗

輸出規定：只輸出 JSON 本身。不要 markdown code fence，不要開場白，不要任何解釋。

訂購信內容如下：
${email}`;

// ────────────────────────────────────────────────────── v3

const V3 = V2; // 差別在 run.ts 會開重試迴路

// ──────────────────────────────────────────────────────

export function buildPrompt(version: Version, email: string): string {
  return { v1: V1, v2: V2, v3: V3 }[version](email);
}

/** v3 重試時，把驗證器的抱怨接回去。注意：訊息要「具體」才有用。 */
export function buildRetry(previous: string, problems: string): string {
  return `你上一次的輸出是：

${previous}

它沒有通過驗證，問題如下：

${problems}

請修正這些問題，重新輸出完整的 JSON。一樣只輸出 JSON，不要任何解釋。`;
}

export { SCHEMA };
