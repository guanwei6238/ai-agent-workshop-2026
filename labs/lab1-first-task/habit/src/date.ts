/**
 * 日期一律用 `YYYY-MM-DD` 字串表示，不在專案裡傳 Date 物件。
 * 理由：存進 JSON 之後本來就是字串，兩種形式混用會一直要轉換。
 */

export type DateString = string;

export function today(): DateString {
  return format(new Date());
}

export function format(d: Date): DateString {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 檢查格式，順便擋掉 2026-13-45 這種東西。 */
export function isValid(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return format(new Date(value)) === value;
}

/** 往前推 n 天。n 可以是負的。 */
export function shift(date: DateString, days: number): DateString {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return format(d);
}

/** date 減去 from，回傳相差幾天。 */
export function diffDays(from: DateString, date: DateString): number {
  return Math.round((new Date(date).getTime() - new Date(from).getTime()) / 86400000);
}
