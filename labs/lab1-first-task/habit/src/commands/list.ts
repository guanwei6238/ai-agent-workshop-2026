import { load } from "../store.ts";
import { dim, table } from "../ui.ts";

export function run(_args: string[]): void {
  const data = load();
  if (data.habits.length === 0) {
    dim("還沒有任何習慣。用 habit add <名字> 開始。");
    return;
  }

  table(
    ["習慣", "建立於", "已完成"],
    data.habits.map((h) => [h.name, h.createdAt, `${h.doneOn.length} 天`]),
  );
}
