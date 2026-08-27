// Lab 0 環境健檢。分成兩關，分開檢查——因為它們的失敗後果不一樣。
//
//   node check.ts
import { run, pi, has, ok, no, tip, dim, C } from "../shared/sh.ts";

let passA = true;
let passB = true;

console.log("\n══ 基本環境 ══");

if (has("node")) {
  const major = Number(process.versions.node.split(".")[0]);
  if (major >= 22) ok(`Node v${process.versions.node}（可以直接跑 .ts）`);
  else {
    no(`Node v${process.versions.node} 太舊，需要 22 以上`);
    tip("這些 lab 直接執行 .ts，不經過編譯");
    passA = false;
  }
} else {
  no("找不到 node");
  passA = false;
}

if (has("git")) {
  ok("git 有裝（Lab 1、Lab 2 的還原功能要它）");
} else {
  no("找不到 git");
  tip("Windows：重跑一次 pi 的安裝指令，它會一起裝 Git for Windows");
  passA = false;
}

const key = process.env.OPENCODE_API_KEY;
if (key) ok(`OPENCODE_API_KEY 有設（${key.slice(0, 6)}…）— 備援路徑可用`);
else {
  dim(`· OPENCODE_API_KEY 沒設 —— ${C.dim}正常，所有 lab 都走 pi${C.reset}`);
  tip("只有在 pi 壞掉、要改用 ZEN_BACKEND=http 時才需要它");
}

console.log("\n══ pi：裝好、登入、會回話 ══");

if (has("pi")) {
  const v = run("pi", ["--version"]).out.split("\n")[0] || "版本未知";
  ok(`pi 有裝（${v}）`);
} else {
  no("找不到 pi");
  tip("到 https://pi.dev/ 複製你系統對應的指令");
  tip('Windows：powershell -c "irm https://pi.dev/install.ps1 | iex"');
  passB = false;
}

if (passA && passB) {
  const model = process.env.ZEN_MODEL ?? "nemotron-3.5-lightning-free";
  dim(`試打一次 ${model} …`);
  const r = pi(["-p", "只回覆兩個字：成功"], { timeout: 90_000 });
  if (r.code === 0 && r.out) {
    ok(`模型有回應：${r.out.split("\n")[0].slice(0, 40)}`);
  } else {
    no("呼叫失敗");
    r.out.split("\n").slice(0, 3).forEach((l) => console.log("      " + l));
    tip("No models available → pi 裡面還沒 /login");
    tip("429 → 這把 key 的額度用完了，等一下再試，或先往下做 mock 的部分");
    tip("502 / 一直沒回應 → 換模型再試。PowerShell 分兩行：");
    tip('  $env:ZEN_MODEL = "hy3-free"');
    tip("  node check.ts");
    passB = false;
  }
}

console.log("\n══ 結果 ══");
if (passA) ok("基本環境沒問題。");
else no("基本環境有問題，先解決這個——所有 lab 都要它。");

if (passB) ok("pi 通了。Lab 0 完成，可以往下做。");
else {
  no("pi 還沒通。");
  tip("先往下做，午休駐點處理。真的不行，Lab 5 / 6 / 7 都有 --backend mock 能離線做完。");
}
console.log();
process.exit(passA ? 0 : 1);
