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
  "ship_by":    string（YYYY-MM-DD}
}`;

const V2 = (email: string) => `幫我從這封信裡把訂單資料整理成 JSON。

${email}

<!-- SCHEMA_START -->
${SCHEMA}
<!-- SCHEMA_END -->

<!-- TODO(2)：放一個「壞掉的輸出長什麼樣、以及它壞在哪」的例子 --><!-- BROKEN_EXAMPLE_START -->
{
  "order_id": 123,
  "customer": 456,
  "currency": "INVALID",
  "items": [{"name": "test", "unit_price": -1, "qty": 0}],
  "subtotal": 0,
  "discount": 100,
  "total": -50,
  "status": "unknown",
  "tracking_no": "",
  "order_date": "bad-date",
  "ship_by": "bad-date"
}<-- BROKEN_EXAMPLE_END -->

<!-- TODO(3)：寫死輸出規定（只能有 JSON，其他一律不行） -->

<!-- OUTPUT_RULES -->
- Output must be pure JSON object with no explanatory text
- Must not contain Markdown code fences marker characters
- No introductions, conclusions, or any explanatory text
- Must match fields and types defined in SCHEMA
- subtotal must equal sum of all items (unit_price × qty)
- total must equal subtotal - discount
- currency must be one of TWD USD or JPY
- When status is shipped, tracking_no is required
- When status is pending, tracking_no must not be provided
- order_date and ship_by must be YYYY-MM-DD format
- discount must be less than or equal to subtotal
- All prices must be non-negative
- qty must be positive integer
`;

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
