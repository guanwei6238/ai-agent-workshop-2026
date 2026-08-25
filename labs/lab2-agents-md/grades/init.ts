// 變成 git repo，並存一份重構前的報表輸出當基準。
// 沒有這個，等一下的 git diff 與還原都做不了。
//
//   node init.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { run, dirOf, ok, no } from "../../shared/sh.ts";

const HERE = dirOf(import.meta.url);
const git = (...a: string[]) => run("git", a, { cwd: HERE });

const baseline = run("node", ["report.ts"], { cwd: HERE });
writeFileSync(join(HERE, "baseline.txt"), `${baseline.out}\n`);

if (!run("git", ["--version"]).code) {
  git("init", "-q");
  git("add", "-A");
  git("-c", "user.name=lab", "-c", "user.email=lab@local", "commit", "-qm", "初始狀態");
  ok("好了。git diff 看得到改動，node restore.ts 可以還原。");
  console.log("    baseline.txt 存的是重構前的報表 —— 重構後要跟它一模一樣。");
} else {
  no("找不到 git —— 還原功能會失效");
  process.exit(1);
}
