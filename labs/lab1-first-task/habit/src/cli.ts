/**
 * habit —— 一個很小的習慣追蹤 CLI。
 *
 *   node src/cli.ts add 早起
 *   node src/cli.ts done 早起
 *   node src/cli.ts list
 */

import { UserError } from "./errors.ts";
import { warn, info } from "./ui.ts";
import * as add from "./commands/add.ts";
import * as done from "./commands/done.ts";
import * as list from "./commands/list.ts";

/** 指令表。加新指令就在這裡多一行，並在 commands/ 開一個檔。 */
const COMMANDS: Record<string, { run: (args: string[]) => void }> = {
  add,
  done,
  list,
};

function main(): void {
  const [name, ...args] = process.argv.slice(2);

  if (!name || name === "help") {
    info("用法：node src/cli.ts <指令> [參數]");
    info(`指令：${Object.keys(COMMANDS).join(", ")}`);
    return;
  }

  const command = COMMANDS[name];
  if (!command) {
    warn(`沒有這個指令：${name}`);
    info(`可用的指令：${Object.keys(COMMANDS).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  command.run(args);
}

try {
  main();
} catch (error) {
  if (error instanceof UserError) {
    warn(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
