// Lab 3：給 agent 一雙手
//
// 這是一個 pi extension。它只做一件事：
// 幫 agent 註冊一個「它本來沒有」的工具。
//
// 不用 npm install，不用 import 任何東西。
//
// 怎麼跑（★ 一定要在 workspace/ 裡面跑 ★）：
//
//   cd workspace
//   pi --provider opencode --model nemotron-3.5-lightning-free \
//      -e ../club-tool.ts -a -p "E205 現在有人嗎？"

// ── 社團內部資料。故意寫在這裡，不放成 .json ──────────────
// 放成檔案的話 agent 會自己去讀，就試不出工具有沒有被呼叫了。
const 社辦狀態: Record<string, { 人數: number; 鑰匙: string; 借到: string | null }> = {
  E205: { 人數: 3, 鑰匙: "器材長", 借到: "21:00" },
  E204: { 人數: 0, 鑰匙: "社長", 借到: null },
  E301: { 人數: 1, 鑰匙: "活動長", 借到: "18:30" },
};

export default function (pi: any) {
  pi.registerTool({
    // ── TODO 1 ──────────────────────────────────────────
    // 工具的名字。只能用小寫英文、數字、底線。
    // 模型會用這個名字呼叫它，所以名字本身也是給模型的線索。
    name: "tool_a",

    // 畫面上顯示的標籤，給人看的，中文可以。
    label: "查社辦狀態",

    // ── TODO 2 ★ 這是本 lab 的重點 ★ ────────────────────
    // 這段字是模型「決定要不要用這個工具」的主要依據。
    // 現在故意寫爛。步驟 3 你要把它改好，然後比較差別。
    description: "一個工具。",

    // ── TODO 3 ──────────────────────────────────────────
    // 這個工具收什麼參數。模型會照這個格式組參數。
    // 注意 description 也是寫給模型看的。
    parameters: {
      type: "object",
      properties: {
        room: { type: "string", description: "參數" },
      },
      required: ["room"],
    },

    // ── TODO 4 ──────────────────────────────────────────
    // 真正去做事的地方。params.room 是模型傳進來的值。
    async execute(_id: string, params: any) {
      const 這間 = 社辦狀態[params.room];
      const 回答 = !這間
        ? `查無 ${params.room} 這間教室`
        : 這間.借到
          ? `${params.room}：目前 ${這間.人數} 人，鑰匙在${這間.鑰匙}身上，借用到 ${這間.借到}`
          : `${params.room}：現在沒有人，鑰匙在${這間.鑰匙}身上`;

      // 回傳格式固定，照抄就好
      return { content: [{ type: "text", text: 回答 }], details: {} };
    },
  });
}
