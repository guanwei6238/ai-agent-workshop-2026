// 還原成初始狀態，準備跑下一次。
//
//   node restore.ts
//
// git clean -fd 會刪掉 agent 新增的檔案（例如 src/commands/streak.ts）——
// 這是故意的。少了它，第二次 agent 面對的是「已經有一份 streak.ts」的專案，
// 它只會微調，兩次就比不出差別。
import { run, dirOf, ok } from "../../shared/sh.ts";

const HERE = dirOf(import.meta.url);
run("git", ["checkout", "."], { cwd: HERE });
run("git", ["clean", "-fdq"], { cwd: HERE });
run("node", ["seed.ts"], { cwd: HERE });
ok("已還原（程式碼 + 資料）");
