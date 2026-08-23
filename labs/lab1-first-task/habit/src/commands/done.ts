import { fail } from "../errors.ts";
import { today, isValid } from "../date.ts";
import { load, save, find } from "../store.ts";
import { ok, warn } from "../ui.ts";

export function run(args: string[]): void {
  const name = args[0];
  if (!name) fail("要給習慣的名字：habit done <名字> [日期]");

  const date = args[1] ?? today();
  if (!isValid(date)) fail(`日期「${date}」不合法，要 YYYY-MM-DD`);

  const data = load();
  const habit = find(data, name);
  if (!habit) fail(`找不到習慣「${name}」`);

  if (habit.doneOn.includes(date)) {
    warn(`${date} 已經記錄過了`);
    return;
  }

  habit.doneOn.push(date);
  habit.doneOn.sort();
  save(data);
  ok(`「${name}」記錄 ${date}`);
}
