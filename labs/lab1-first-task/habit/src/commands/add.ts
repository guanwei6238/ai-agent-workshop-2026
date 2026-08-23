import { fail } from "../errors.ts";
import { today } from "../date.ts";
import { load, save, find } from "../store.ts";
import { ok } from "../ui.ts";

/** 每個指令都 export 一個 run(args)，簽章一致。 */
export function run(args: string[]): void {
  const name = args[0];
  if (!name) fail("要給習慣的名字：habit add <名字>");

  const data = load();
  if (find(data, name)) fail(`「${name}」已經存在了`);

  data.habits.push({ name, createdAt: today(), doneOn: [] });
  save(data);
  ok(`新增習慣「${name}」`);
}
