/** Lab 7 的資料形狀。這份 schema 也會被貼進 prompt（見 prompts.ts）。 */

export const CURRENCIES = ["TWD", "USD", "JPY"] as const;
export type Currency = (typeof CURRENCIES)[number];

export interface Item {
  name: string;
  unit_price: number;
  qty: number;
}

export interface Order {
  order_id: string;
  customer: string;
  currency: Currency;
  items: Item[];
  subtotal: number;
  discount: number;
  total: number;
  status: "pending" | "shipped";
  tracking_no?: string;
  order_date: string; // YYYY-MM-DD
  ship_by: string;    // YYYY-MM-DD
}

/** 一個驗證問題。layer 對應課堂講的四層防線。 */
export interface Problem {
  layer: 1 | 2 | 3;
  code: string;
  message: string;
}

export const LAYER_NAME: Record<number, string> = {
  1: "格式",
  2: "Schema",
  3: "邏輯",
};
