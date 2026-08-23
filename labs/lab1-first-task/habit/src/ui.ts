/**
 * 所有輸出都經過這裡。
 * 專案裡不直接呼叫 console.log —— 這樣之後要改成寫檔或加顏色只要改一個地方。
 */

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

export function ok(message: string): void {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

export function warn(message: string): void {
  console.log(`${YELLOW}!${RESET} ${message}`);
}

export function info(message: string): void {
  console.log(message);
}

export function dim(message: string): void {
  console.log(`${DIM}${message}${RESET}`);
}

/** 印一張表。欄寬自動對齊，中文字算兩格。 */
export function table(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(displayWidth(h), ...rows.map((r) => displayWidth(r[i] ?? ""))),
  );
  const line = (cells: string[]) =>
    cells.map((c, i) => c + " ".repeat(widths[i] - displayWidth(c))).join("  ");

  console.log(`${DIM}${line(headers)}${RESET}`);
  for (const row of rows) console.log(line(row));
}

function displayWidth(text: string): number {
  let n = 0;
  for (const ch of text) n += /[⺀-꓏가-힣豈-﫿＀-｠]/.test(ch) ? 2 : 1;
  return n;
}
