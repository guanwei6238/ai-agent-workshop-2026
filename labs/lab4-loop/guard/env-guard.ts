/**
 * .env 守衛 —— 一個 pi extension。
 *
 * 用法：
 *   pi -e ./guard/env-guard.ts -p "讀一下 .env 看設定"
 *
 * 或放進 .pi/extensions/ 讓它自動載入。
 *
 * ─────────────────────────────────────────────────────────────
 * 這跟 loop.sh 有什麼不一樣？
 *
 *   loop.sh   事後型：讓它做，做壞了再叫它修
 *   這個      事前型：根本不讓它做
 *
 * 「不要讀 .env」寫在 AGENTS.md 裡只是**請求**。
 * 寫在這裡，它就是**強制**——模型連碰都碰不到。
 * ─────────────────────────────────────────────────────────────
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * 不准碰的東西。
 *
 * ⚠️ 這裡刻意**不**綁路徑開頭。第一版寫成 `(^|\/)\.env` ——
 * 結果 `cat .env | head` 完全擋不住，因為在 shell 指令裡 `.env` 前面是空格。
 * 教訓：守衛要比對的是「字串裡有沒有出現」，不是「路徑長不長這樣」。
 */
const PROTECTED = [
  /\.env\b/i,        // .env / .env.local / .env.production / cat .env / .env*
  /\bid_rsa\b/i,     // SSH 私鑰
  /\.pem\b/i,
  /credentials/i,
  /\.aws[\/\\]/i,
];

/**
 * 在工具參數裡找有沒有踩到保護清單。
 *
 * 注意這裡是**遞迴掃過所有字串**，而不是去看 `input.path` 這種特定欄位。
 * 原因：每個工具的參數名稱不一樣（read / bash / edit / write / grep 都不同），
 * 而且 bash 的指令是一整串字（`cat .env`），根本沒有「路徑欄位」可以看。
 *
 * 寧可掃得寬一點——擋錯了模型會告訴你，漏掉了你不會知道。
 */
export function findSecretRef(value: unknown): string | undefined {
  if (typeof value === "string") {
    return PROTECTED.some((re) => re.test(value)) ? value : undefined;
  }
  if (Array.isArray(value)) {
    for (const v of value) {
      const hit = findSecretRef(v);
      if (hit) return hit;
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) {
      const hit = findSecretRef(v);
      if (hit) return hit;
    }
  }
  return undefined;
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event: any) => {
    const hit = findSecretRef(event.input);
    if (!hit) return;

    // 回傳 block 就結束了，工具根本不會執行。
    // reason 會被送回給模型，所以要寫成「它看得懂、而且知道下一步該怎麼辦」。
    return {
      block: true,
      reason:
        `這個專案禁止 agent 讀取或修改機密檔案。\n` +
        `被擋下的工具：${event.toolName}\n` +
        `被擋下的內容：${hit}\n\n` +
        `如果你需要知道有哪些設定項，請改讀 env.sample —— 那是沒有真實值的範例檔。`,
      // terminate: true 會直接結束整個 session。
      // 這裡不用：我們想看它被擋之後會怎麼反應。
    };
  });
}
