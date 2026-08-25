// 跨平台的小工具，讓 lab 腳本在 PowerShell / bash / macOS 上行為一致。
//
// 為什麼不用 .sh：教室是 Windows 11，學生在 PowerShell 裡打指令，
// `./verify.sh` 不會動。每個 lab 本來就需要 Node 24，所以腳本一律寫成 .ts。
import { spawnSync } from "node:child_process";

// Windows 的 npm 全域指令是 .cmd，直接 spawn 會 ENOENT
const WIN = process.platform === "win32";

export const C = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
};

export const ok = (msg: string) => console.log(`  ${C.green}✓${C.reset} ${msg}`);
export const no = (msg: string) => console.log(`  ${C.red}✗${C.reset} ${msg}`);
export const tip = (msg: string) => console.log(`    ${C.dim}${msg}${C.reset}`);
export const dim = (msg: string) => console.log(`  ${C.dim}${msg}${C.reset}`);

export type RunResult = { code: number; out: string };

/** 跑一個指令，回傳 exit code 與合併後的 stdout+stderr。不會 throw。 */
export function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeout?: number; input?: string } = {},
): RunResult {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd,
    timeout: opts.timeout,
    input: opts.input,
    encoding: "utf8",
    shell: WIN,               // Windows 上才需要，讓 pi.cmd / git.cmd 找得到
    windowsHide: true,
  });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  // spawnSync 找不到指令時 status 是 null
  return { code: r.status ?? (r.error ? 127 : 1), out };
}

/** 這個指令存在嗎？ */
export function has(cmd: string): boolean {
  return run(WIN ? "where" : "which", [cmd]).code === 0;
}

/** 跑一個 pi 指令。集中在這裡，模型與 provider 只寫一次。 */
export function pi(
  args: string[],
  opts: { cwd?: string; timeout?: number } = {},
): RunResult {
  const model = process.env.ZEN_MODEL ?? "nemotron-3.5-lightning-free";
  return run("pi", ["--provider", "opencode", "--model", model, ...args], opts);
}

/** 直接把子行程的輸出接到終端機（要即時看到 agent 在做什麼時用）。 */
export function runLive(
  cmd: string,
  args: string[],
  opts: { cwd?: string } = {},
): number {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd,
    stdio: "inherit",
    shell: WIN,
    windowsHide: true,
  });
  return r.status ?? 1;
}

/** 這個檔案（相對於呼叫它的腳本）所在的目錄。 */
export function dirOf(importMetaUrl: string): string {
  return new URL(".", importMetaUrl).pathname.replace(/^\/([A-Za-z]:)/, "$1");
}
