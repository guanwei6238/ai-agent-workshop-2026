// 還原成初始狀態，準備跑下一次。
// git clean -fd 會刪掉 agent 新增的檔案，這是故意的。
//
//   node restore.ts
import { run, dirOf, ok } from "../../shared/sh.ts";

const HERE = dirOf(import.meta.url);
run("git", ["checkout", "."], { cwd: HERE });
run("git", ["clean", "-fdq", "-e", "baseline.txt"], { cwd: HERE });
ok("已還原");
