// 把這個專案變成 git repo，並產生種子資料。
// 這樣等一下才能用 git diff 看 agent 改了什麼、用 restore 還原。
//
//   node init.ts
import { run, dirOf, ok, no } from "../../shared/sh.ts";

const HERE = dirOf(import.meta.url);
const git = (...a: string[]) => run("git", a, { cwd: HERE });

run("node", ["seed.ts"], { cwd: HERE });

if (!run("git", ["--version"]).code) {
  git("init", "-q");
  git("add", "-A");
  git("-c", "user.name=lab", "-c", "user.email=lab@local", "commit", "-qm", "初始狀態");
  ok("好了。git diff 看得到 agent 的改動，node restore.ts 可以還原。");
} else {
  no("找不到 git —— 還原功能會失效");
  console.log("    Windows 請重跑 pi 的安裝指令，它會一起裝 Git for Windows。");
  process.exit(1);
}
