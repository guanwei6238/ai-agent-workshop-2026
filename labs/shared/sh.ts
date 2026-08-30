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
  const model = process.env.ZEN_MODEL ?? "mimo-v2.5-free";
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

/**
 * 跑一個指令，而且在等待的時候印出「還活著」的心跳。
 *
 * 為什麼需要這個：`pi -p` 在做完之前**一個字都不會輸出**（實測跑 100 秒
 * 完全空白）。學生會以為當掉了，然後按 Ctrl+C。所以我們自己每隔幾秒
 * 印一次經過的秒數。
 */
export async function runWithHeartbeat(
  cmd: string,
  args: string[],
  opts: { cwd?: string; label?: string; timeout?: number } = {},
): Promise<RunResult & { timedOut?: boolean }> {
  const { spawn } = await import("node:child_process");
  const label = opts.label ?? "工作中";
  const limit = opts.timeout ?? 0;
  const started = Date.now();

  const tick = setInterval(() => {
    const s = Math.round((Date.now() - started) / 1000);
    const left = limit ? `${C.dim}（${Math.max(0, Math.round(limit / 1000) - s)} 秒後放棄）${C.reset}` : "";
    process.stdout.write(`\r  ${C.dim}⏳ ${label}… ${s} 秒${C.reset} ${left}   `);
  }, 2000);

  return new Promise<RunResult & { timedOut?: boolean }>((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: WIN,
      windowsHide: true,
    });

    // 免費模型偶爾會卡在等回應：連線還在、CPU 幾乎 0、什麼都不回。
    // 沒有這個上限的話，學生會盯著心跳等到下課。
    let timedOut = false;
    const bomb = limit
      ? setTimeout(() => {
          timedOut = true;
          child.kill("SIGTERM");
          setTimeout(() => child.kill("SIGKILL"), 3000);
        }, limit)
      : null;

    let out = "";
    const collect = (d: Buffer) => {
      out += d.toString();
      // 真的有輸出的時候，先把心跳那一行擦掉再印
      process.stdout.write(`\r${" ".repeat(40)}\r`);
      process.stdout.write(d);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);

    child.on("close", (code) => {
      clearInterval(tick);
      if (bomb) clearTimeout(bomb);
      process.stdout.write(`\r${" ".repeat(52)}\r`);
      const s = Math.round((Date.now() - started) / 1000);
      if (timedOut) {
        no(`等了 ${s} 秒還是沒回應，先放棄這一輪。`);
      } else {
        console.log(`  ${C.dim}（花了 ${s} 秒）${C.reset}`);
      }
      resolve({ code: timedOut ? 124 : (code ?? 1), out: out.trim(), timedOut });
    });
    child.on("error", () => {
      clearInterval(tick);
      if (bomb) clearTimeout(bomb);
      resolve({ code: 127, out: `找不到指令：${cmd}` });
    });
  });
}

/** 這個檔案（相對於呼叫它的腳本）所在的目錄。 */
export function dirOf(importMetaUrl: string): string {
  return new URL(".", importMetaUrl).pathname.replace(/^\/([A-Za-z]:)/, "$1");
}
