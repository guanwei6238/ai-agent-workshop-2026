// Lab 3 參考解。卡住再看，先自己試過。
//
// 這是一個 pi extension。它只做一件事：
// 幫 agent 註冊一個「它本來沒有」的工具。
//
// 不用 npm install，不用 import 任何東西。
//
// 怎麼跑（★ 一定要在 workspace/ 裡面跑 ★）：
//
//   cd workspace
//   pi -e ../solution/club-tool.ts --provider opencode --model nemotron-3.5-lightning-free
//   然後輸入：我等一下想去社辦寫 code，E205 現在方便嗎？

// ── 社團內部資料。故意寫在這裡，不放成 .json ──────────────────
// 放成檔案的話 agent 會自己去讀，就試不出工具有沒有被呼叫了。
type RoomStatus = {
  occupied: number;      // 目前幾個人在裡面
  keyHolder: string;     // 鑰匙在哪位幹部身上
  bookedUntil: string | null;  // 借用到幾點，null = 沒人借
};

const ROOMS: Record<string, RoomStatus> = {
  E205: { occupied: 3, keyHolder: "器材長", bookedUntil: "21:00" },
  E204: { occupied: 0, keyHolder: "社長", bookedUntil: null },
  E301: { occupied: 1, keyHolder: "活動長", bookedUntil: "18:30" },
};

export default function (pi: any) {
  pi.registerTool({
    name: "club_room_status",

    // 畫面上顯示的標籤，給人看的，中文可以。
    label: "查社辦狀態",

    // 具體寫出「查得到什麼」與「什麼時候該用」。
    // 對照組是 "一個工具。"——那樣寫，間接一點的問法它就不會呼叫。
    description:
      "查詢社團社辦教室現在的使用狀態：裡面有幾個人、鑰匙在哪一位幹部身上、" +
      "借用到幾點。當使用者問到社辦現在方不方便去、有沒有人、鑰匙在誰那裡的時候使用。" +
      "這是社團內部資料，網路上查不到，也沒有任何檔案有這份資料。",

    parameters: {
      type: "object",
      properties: {
        room: { type: "string", description: "社辦教室代號，例如 E205、E204、E301" },
      },
      required: ["room"],
    },

    async execute(_id: string, params: { room: string }) {
      const status = ROOMS[params.room];

      let answer: string;
      if (!status) {
        answer = `查無 ${params.room} 這間教室`;
      } else if (status.bookedUntil) {
        answer =
          `${params.room}：目前 ${status.occupied} 人，` +
          `鑰匙在${status.keyHolder}身上，借用到 ${status.bookedUntil}`;
      } else {
        answer = `${params.room}：現在沒有人，鑰匙在${status.keyHolder}身上`;
      }

      // 回傳格式固定，照抄就好
      return { content: [{ type: "text", text: answer }], details: {} };
    },
  });
}
