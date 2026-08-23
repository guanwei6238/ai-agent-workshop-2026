/**
 * 四層防線裡的前三層。第四層（語意）需要人或另一個模型，這裡不做。
 *
 * 進階題在檔案最下面。
 */

import { CURRENCIES, LAYER_NAME, type Order, type Problem } from "./types.ts";

const p = (layer: 1 | 2 | 3, code: string, message: string): Problem => ({ layer, code, message });

/** 第 1 層：它到底有沒有給我合法的 JSON？ */
export function layer1(raw: string): { problems: Problem[]; value?: unknown } {
  try {
    return { problems: [], value: JSON.parse(raw) };
  } catch {
    const hint = raw.includes("```")
      ? "輸出被包在 markdown code fence 裡"
      : /^[^{[]/.test(raw.trim())
        ? "JSON 前面有多餘的說明文字"
        : "不是合法的 JSON";
    return { problems: [p(1, "not-json", `JSON.parse() 失敗：${hint}`)] };
  }
}

/** 第 2 層：欄位在不在、型別對不對、enum 合不合法。 */
export function layer2(v: any): Problem[] {
  const out: Problem[] = [];
  const need = (k: string, t: string) => {
    if (v?.[k] === undefined) out.push(p(2, "missing-field", `缺少欄位 ${k}`));
    else if (typeof v[k] !== t) out.push(p(2, "wrong-type", `${k} 應該是 ${t}，拿到 ${typeof v[k]}`));
  };
  if (typeof v !== "object" || v === null) return [p(2, "not-object", "最外層不是物件")];

  need("order_id", "string");
  need("customer", "string");
  need("currency", "string");
  need("subtotal", "number");
  need("discount", "number");
  need("total", "number");
  need("status", "string");
  need("order_date", "string");
  need("ship_by", "string");

  if (!Array.isArray(v.items)) out.push(p(2, "missing-field", "items 不是陣列"));
  else
    v.items.forEach((it: any, i: number) => {
      if (typeof it?.name !== "string") out.push(p(2, "wrong-type", `items[${i}].name 不是字串`));
      if (typeof it?.unit_price !== "number") out.push(p(2, "wrong-type", `items[${i}].unit_price 不是數字`));
      if (typeof it?.qty !== "number") out.push(p(2, "wrong-type", `items[${i}].qty 不是數字`));
    });

  if (typeof v.currency === "string" && !CURRENCIES.includes(v.currency))
    out.push(p(2, "bad-currency", `currency「${v.currency}」不在允許清單 ${CURRENCIES.join("/")} 內`));

  if (typeof v.status === "string" && !["pending", "shipped"].includes(v.status))
    out.push(p(2, "bad-status", `status「${v.status}」不合法`));

  for (const k of ["order_date", "ship_by"])
    if (typeof v[k] === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(v[k]))
      out.push(p(2, "bad-date-format", `${k}「${v[k]}」不是 YYYY-MM-DD`));

  return out;
}

/**
 * 第 3 層：欄位之間的關係。
 *
 * 這一層是重點：上面兩層全過的資料，在這裡還是可能整份是錯的，
 * 因為每個欄位「單獨看」都很合理。
 */
export function layer3(o: Order): Problem[] {
  const out: Problem[] = [];

  if (Array.isArray(o.items) && o.items.length === 0)
    out.push(p(3, "empty-items", "items 是空的，但這是一張訂單"));

  const sum = (o.items ?? []).reduce((a, i) => a + i.unit_price * i.qty, 0);
  if (Math.abs(sum - o.subtotal) > 0.001)
    out.push(p(3, "subtotal-mismatch", `subtotal 是 ${o.subtotal}，但品項加起來是 ${sum}`));

  if (Math.abs(o.subtotal - o.discount - o.total) > 0.001)
    out.push(p(3, "total-mismatch", `total 是 ${o.total}，但 subtotal(${o.subtotal}) - discount(${o.discount}) = ${o.subtotal - o.discount}`));

  if (o.discount > o.subtotal)
    out.push(p(3, "discount-too-big", `discount(${o.discount}) 大於 subtotal(${o.subtotal})`));

  if (o.discount < 0) out.push(p(3, "negative-discount", `discount 是負數（${o.discount}）`));

  if (o.status === "shipped" && !o.tracking_no)
    out.push(p(3, "shipped-without-tracking", "status 是 shipped，但沒有 tracking_no"));

  if (o.order_date && o.ship_by && o.ship_by < o.order_date)
    out.push(p(3, "ship-before-order", `ship_by(${o.ship_by}) 早於 order_date(${o.order_date})`));

  // ─────────────────────────────────────────────────────────────
  // 進階題：自己補上至少兩條這裡沒有的規則。想一想還有什麼「每個欄位
  // 單獨看都合理，但合起來不對」的情況？
  //
  // TODO(進階 1)：
  // TODO(進階 2)：
  // ─────────────────────────────────────────────────────────────

  return out;
}

/** 跑完整條防線。任何一層有問題就回報，第 1 層失敗就不往下走。 */
export function validate(raw: string): Problem[] {
  const l1 = layer1(raw);
  if (l1.problems.length) return l1.problems;
  const l2 = layer2(l1.value);
  if (l2.length) return l2;
  return layer3(l1.value as Order);
}

export const describe = (ps: Problem[]) =>
  ps.map((x) => `[${LAYER_NAME[x.layer]}/${x.code}] ${x.message}`).join("\n");
