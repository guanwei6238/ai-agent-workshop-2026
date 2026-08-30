// Lab 3 步驟 4（進階）參考解。**先自己試過再看。**
//
// 跟 solution/club-tool.ts 的差別只有一個：多註冊了第二個工具
// club_book_room —— 它會「改變狀態」，不只是查。
//
//   cd workspace
//   pi -e ../solution/club-tool-advanced.ts --provider opencode --model mimo-v2.5-free
//
//   先問：E205 現在方便嗎？          → 會呼叫 club_room_status
//   再說：幫我把 E204 借兩個小時      → 會呼叫 club_book_room
//   再問：E204 現在方便嗎？          → 借用時間變了，看得出狀態真的被改掉

type RoomStatus = {
  occupied: number;
  keyHolder: string;
  bookedUntil: string | null;
};

// 注意這裡不是 const 就不能改 —— ROOMS 的「內容」是可變的。
// 這正是「查」跟「做」的差別：下面第二個工具會寫進這份資料。
const ROOMS: Record<string, RoomStatus> = {
  E205: { occupied: 3, keyHolder: "器材長", bookedUntil: "21:00" },
  E204: { occupied: 0, keyHolder: "社長", bookedUntil: null },
  E301: { occupied: 1, keyHolder: "活動長", bookedUntil: "18:30" },
};

// 借用紀錄。真實專案裡這會是資料庫的一列。
const BOOKINGS: { room: string; hours: number; until: string }[] = [];

/** 從現在時間往後推 n 小時，回傳 HH:MM。 */
function addHours(hours: number): string {
  const t = new Date(Date.now() + hours * 3600_000);
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}

export default function (pi: any) {
  // ── 工具一：查（跟基礎解一樣，唯讀）────────────────────────
  pi.registerTool({
    name: "club_room_status",
    label: "查社辦狀態",
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
      return { content: [{ type: "text", text: answer }], details: {} };
    },
  });

  // ── 工具二：做（★ 步驟 4 的重點：它會改變狀態 ★）──────────
  pi.registerTool({
    name: "club_book_room",
    label: "借用社辦",

    // description 的寫法跟工具一同一個原則：把「什麼時候用」寫出來。
    // 注意這裡多了一句「這個動作會實際登記」——那是寫給模型看的警語，
    // 讓它在不確定的時候傾向先問過使用者。
    description:
      "登記借用社團社辦教室，指定教室代號與要借幾小時。" +
      "當使用者說要借教室、要預約社辦、要把某間教室留下來的時候使用。" +
      "注意：這個動作會實際寫入借用紀錄並改變教室狀態，不是查詢。",

    parameters: {
      type: "object",
      properties: {
        room: { type: "string", description: "社辦教室代號，例如 E205、E204、E301" },
        hours: { type: "number", description: "要借幾個小時，例如 2 代表兩小時" },
      },
      required: ["room", "hours"],
    },

    async execute(_id: string, params: { room: string; hours: number }) {
      const status = ROOMS[params.room];
      if (!status) {
        return {
          content: [{ type: "text", text: `查無 ${params.room} 這間教室，沒有登記` }],
          details: {},
        };
      }

      // ★ 這一行就是「查」跟「做」的分界：狀態被改掉了。
      const until = addHours(params.hours);
      status.bookedUntil = until;
      BOOKINGS.push({ room: params.room, hours: params.hours, until });

      return {
        content: [{
          type: "text",
          text: `已登記：${params.room} 借用 ${params.hours} 小時，到 ${until}。` +
                `目前總共有 ${BOOKINGS.length} 筆借用紀錄。`,
        }],
        details: {},
      };
    },
  });
}
