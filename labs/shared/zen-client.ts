/**
 * 共用的 LLM 呼叫層。三個 backend：
 *
 *   cli   （預設）透過 `pi -p` 呼叫。走 pi 正常的額度路徑，教室裡最不會出事。
 *   http  直接打 Zen 的 HTTP API。Lab 6 步驟 2 要用它示範「Server + API key」。
 *   mock  完全離線的假模型。網路掛掉、額度用完、或課前彩排時用。
 *
 * 為什麼預設走 cli：直接裸打 API 的匿名額度非常低（實測第 2、3 次就被擋，
 * 而且是以「天」計）。走 pi 是官方支援的路徑，不需要為了額度做任何奇怪的事。
 */

import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type Backend = "cli" | "http" | "mock";

export interface AskOptions {
  system?: string;
  model?: string;
  backend?: Backend;
  /** mock backend 用：同一題的識別碼。相同 seed = 同一封信 */
  seed?: number;
  /** mock backend 用：第幾次嘗試（重試迴路用）。0 起算 */
  attempt?: number;
  /**
   * cli backend 用：在哪個目錄跑。
   *
   * ⚠️ 這個很重要：pi 是 agent，它有讀檔工具。如果你想問「它本來知不知道」，
   * 就不能在資料旁邊問——它會自己去讀，然後你以為它「本來就知道」。
   */
  cwd?: string;
}

export interface AskResult {
  text: string;
  /** cli backend 拿不到真實用量，這裡是估計值（字元數 / 4） */
  tokens: number;
  tokensAreEstimate: boolean;
  backend: Backend;
  ms: number;
}

/**
 * `ask()` 預設跑在一個空的暫存目錄裡。
 *
 * ⚠️ 這不是潔癖，是正確性問題。pi 是 agent，`-p` 模式下它一樣有讀檔與
 * grep 的能力。如果讓它在 lab 的目錄裡跑，它會讀到不該讀的東西：
 *
 *   Lab 5  讀到 knowledge/club-handbook.md 與 ask.ts
 *          → 不回答問題，改成「解釋這支腳本」然後反問你要問哪一題
 *   Lab 7  讀到 validate.ts（評分它的驗證器）與 order.json（正確答案）
 *          → 整個 eval 的數字失去意義
 *   Lab 6  讀到 README.md
 *          → 看起來像答對了，其實是抄的
 *
 * 這三個 lab 要的都是「問模型一個問題」，不是「讓 agent 在我的專案裡工作」。
 * 所以隔離是對的預設值；真的需要讓它看到檔案的呼叫端再自己傳 cwd。
 */
let ISOLATED: string | undefined;
const isolatedDir = () =>
  (ISOLATED ??= mkdtempSync(join(tmpdir(), "zen-no-context-")));

const DEFAULT_MODEL = process.env.ZEN_MODEL ?? "mimo-v2.5-free";
const DEFAULT_BACKEND = (process.env.ZEN_BACKEND as Backend) ?? "cli";

export async function ask(prompt: string, opts: AskOptions = {}): Promise<AskResult> {
  const backend = opts.backend ?? DEFAULT_BACKEND;
  const model = opts.model ?? DEFAULT_MODEL;
  const t0 = Date.now();

  let text: string;
  let tokens: number;
  let estimate = true;

  if (backend === "mock") {
    text = mockReply(prompt, opts.seed ?? Math.floor(Math.random() * 1e9), opts.attempt ?? 0);
    tokens = estimateTokens(prompt + text);
  } else if (backend === "http") {
    const r = await askHttp(prompt, model, opts.system);
    text = r.text;
    tokens = r.tokens ?? estimateTokens(prompt + r.text);
    estimate = r.tokens === undefined;
  } else {
    text = await askCli(prompt, model, opts.system, opts.cwd ?? isolatedDir());
    tokens = estimateTokens(prompt + text);
  }

  return { text, tokens, tokensAreEstimate: estimate, backend, ms: Date.now() - t0 };
}

const estimateTokens = (s: string) => Math.ceil(s.length / 4);

// ---------------------------------------------------------------- cli

/**
 * 把 provider 的錯誤翻成「學生知道下一步該做什麼」的話。
 *
 * 這些 lab 不像 Lab 1～4 會讓學生自己打 `--model`，模型是這裡決定的 ——
 * 所以模型掛掉的時候，學生看到的只有一串 JSON，完全不知道是模型的問題。
 * 免費模型每天都在變（401 下架、429 額度、整個不回應都遇過），
 * 這段話要直接告訴他們去跑 pick-model.ts。
 */
function explainZenError(model: string, code: number, raw: string): string {
  const head = `呼叫模型失敗（${model}，結束碼 ${code}）\n　${raw}`;
  let why = "";
  if (/\b401\b|not supported/i.test(raw))
    why = `這個模型已經被 provider 下架了。`;
  else if (/\b429\b|UsageLimit/i.test(raw))
    why = `這把 key 對這個模型的免費額度用完了。`;
  else if (/No models available/i.test(raw))
    why = `pi 還沒登入 —— 開 pi 打 /login。`;
  else if (raw === "")
    why = `模型沒有回應（免費模型偶爾整個卡住）。`;

  return (
    `${head}\n\n` +
    (why ? `　${why}\n` : "") +
    `　★ 先跑 node ../pick-model.ts 看今天哪個模型能用，然後：\n` +
    `　　  PowerShell：  $env:ZEN_MODEL = "換成它印出來的"\n` +
    `　　  Mac / Linux： export ZEN_MODEL=換成它印出來的\n` +
    `　趕時間的話加 --backend mock 先把流程跑完，不要乾等。`
  );
}

/**
 * 把 prompt 寫成檔案再用 `@檔名` 餵給 pi，而不是塞進 argv。
 *
 * ⚠️ 這不是為了漂亮，是 Windows 上的正確性問題。
 *
 * Windows 的 npm 裝的是 `pi.cmd`，Node 的 spawn 不開 shell 找不到它，所以這裡
 * 必須 `shell: true`。但 `shell: true` 的 argv **不會被跳脫，只會被串接**
 * （Node 自己的 DEP0190 警告就是在講這件事）—— 於是含換行的 prompt 會被
 * cmd.exe 在第一個換行處切斷。
 *
 * 實際發生過：Lab 5 的 RAG prompt 第一行是「以下是社團手冊的相關段落：」，
 * 模型只收到那一行，於是回「請直接貼上社團手冊的段落內容」。
 * 檢索明明成功了，看起來卻像 RAG 沒生效 —— 而且完全沒有錯誤訊息。
 *
 * 用 `@檔名` 之後 argv 只剩短短的相對檔名，沒有換行也沒有空白，cmd.exe 弄不壞它。
 * 寫在 cwd 裡並用相對路徑，是為了避開 Windows 暫存路徑可能含空白的問題。
 */
const PROMPT_FILE = ".pi-prompt.md";

function askCli(prompt: string, model: string, system?: string, cwd?: string): Promise<string> {
  const full = system ? `${system}\n\n---\n\n${prompt}` : prompt;
  const dir = cwd ?? isolatedDir();
  const promptPath = join(dir, PROMPT_FILE);
  writeFileSync(promptPath, full, "utf8");

  // --no-tools：這幾個 lab 都是「問模型一個問題」，不需要任何工具。
  // 節 2 講的「拜託 vs 強制」—— 這一行就是強制，比在 prompt 裡寫「不要讀檔」可靠。
  const args = [
    "--provider", "opencode", "--model", model,
    "--no-tools", "-p", `@${PROMPT_FILE}`,
  ];
  return new Promise((resolve, reject) => {
    const child = spawn("pi", args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      cwd: dir,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) =>
      reject(
        new Error(
          `跑不動 pi：${e.message}\n` +
            `　Windows 請確認 pi 裝好了、而且開新的終端機讓 PATH 生效。\n` +
            `　還是不行就先用 --backend mock 往下做。`,
        ),
      ),
    );
    child.on("close", (code) => {
      rmSync(promptPath, { force: true });
      if (code !== 0) {
        const raw = (err.trim() || out.trim()).slice(0, 300);
        reject(new Error(explainZenError(model, code, raw)));
      } else resolve(out.trim());
    });
  });
}

// ---------------------------------------------------------------- http

async function askHttp(prompt: string, model: string, system?: string) {
  const key = process.env.OPENCODE_API_KEY;
  if (!key) throw new Error("沒有設 OPENCODE_API_KEY。先 `export OPENCODE_API_KEY=...`");

  const messages = system
    ? [{ role: "system", content: system }, { role: "user", content: prompt }]
    : [{ role: "user", content: prompt }];

  const res = await fetch("https://opencode.ai/zen/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages }),
  });

  if (res.status === 429) {
    throw new Error(
      "429：額度被擋了。\n" +
        "直接打 API 的額度比走 pi 低很多，這正是 Lab 6 要講的事。\n" +
        "改用 --backend cli（走 pi）或 --backend mock（離線）。",
    );
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);

  const j: any = await res.json();
  return {
    text: (j.choices?.[0]?.message?.content ?? "").trim(),
    tokens: j.usage?.total_tokens as number | undefined,
  };
}

// ---------------------------------------------------------------- mock

/**
 * 假模型：專門用來模擬「格式對、但欄位邏輯錯」這類 LLM 的典型failure。
 *
 * ⚠️ 這是模擬，不是真模型。它會依 prompt 裡有沒有出現特定關鍵字（schema、
 * 錯誤示範、上一次的錯誤）來降低出錯率——因為那正是 Lab 7 要學生驗證的假設。
 * 用它跑出來的數字可以拿來練流程，但不能拿來宣稱「真模型也是這個表現」。
 */
function mockReply(prompt: string, seed: number, attempt: number): string {
  // 依任務型態切換。三種：抽訂單（Lab 7）、看著資料回答（Lab 5 有檢索）、
  // 沒有資料就說沒有（Lab 5 對照組、Lab 6）。
  if (/訂單|order_id|"unit_price"/.test(prompt)) return mockOrder(prompt, seed, attempt);
  if (/請只根據上面的內容回答|相關段落/.test(prompt)) return mockGrounded(prompt);
  return mockNoData(prompt);
}

/** 有資料時：從給的段落裡找最相關的一句回答。 */
function mockGrounded(prompt: string): string {
  const ctx = prompt.split("---")[0] ?? "";
  const q = prompt.split("問題：").pop() ?? "";
  if (/沒有找到相關段落/.test(prompt)) return "手冊裡沒有寫。";
  const grams = new Set<string>();
  for (let i = 0; i < q.length - 1; i++) {
    const g = q.slice(i, i + 2);
    if (!/[\s，。？?、]/.test(g)) grams.add(g);
  }
  const best = ctx
    .split(/\n/)
    .filter((l) => l.trim() && !l.startsWith("#"))
    // 問「幾」「多少」的時候，有數字的句子優先
    .map((l) => ({
      l,
      s: [...grams].filter((g) => l.includes(g)).length +
         (/幾|多少|上限|最多|至少/.test(q) && /\d/.test(l) ? 2 : 0),
    }))
    .sort((a, b) => b.s - a.s)[0];
  return best && best.s > 0
    ? `根據手冊：${best.l.replace(/^[-*]\s*/, "").trim()}`
    : "手冊裡沒有寫。";
}

/**
 * 沒有資料時：說沒有，並要求把資料貼上來。
 *
 * 這模仿的是現在的模型的實際行為——它們不會替「我們社團的規定」這種
 * 明顯私有的事實編答案，而是直接說沒有、並告訴你需要什麼。
 * 節 1 的現場截圖就是這個樣子。
 *
 * 注意：能力較弱的模型有時反而會編一個數字。那更糟，也正是節 4 要處理的問題。
 * 想在離線時示範「它會編」的話，把這個函式換掉即可。
 */
function mockNoData(prompt: string): string {
  const what = /幾分鐘|多久|時間/.test(prompt)
    ? "報告時間"
    : /幾天|期限|借/.test(prompt)
      ? "借用期限"
      : /幾個|幾副|多少|上限/.test(prompt)
        ? "數量規定"
        : "這項規定";
  return (
    `我沒有你們社團的內部資料，所以無法確認${what}。\n\n` +
    `如果你把相關的公告、手冊或截圖貼上來，我可以直接幫你找出答案。`
  );
}

function mockOrder(prompt: string, seed: number, attempt: number): string {
  // 兩組亂數：
  //   sticky   只跟題目有關 → 重試也不會變。模擬「它就是把日期讀反了」這種錯。
  //   volatile 跟嘗試次數有關 → 重試時有機會修好。模擬格式、算術這類錯。
  let a = seed >>> 0;
  const sticky = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  let b = (seed ^ (attempt * 7919 + 12345)) >>> 0;
  const rnd = () => ((b = (b * 1664525 + 1013904223) >>> 0) / 4294967296);

  // 判定「prompt 有沒有真的被強化」。看的是實際內容的特徵，不是 TODO 註解。
  const hasSchema = /"unit_price"/.test(prompt);
  const hasCounterExample = /錯誤示範|不要這樣做|反例/.test(prompt);
  const hasFormatRule = /只輸出|不要輸出|不要加任何|不要任何解釋/.test(prompt);
  const isRetry = /沒有通過驗證/.test(prompt);

  // 出錯機率：每多一個強化手段就下降
  let pFence = 0.35;
  let pPreamble = 0.3;
  let pMathWrong = 0.55;
  let pBadCurrency = 0.25;
  let pMissingTracking = 0.3;
  if (hasSchema) { pBadCurrency -= 0.22; pMissingTracking -= 0.2; }
  if (hasCounterExample) { pMathWrong -= 0.35; }
  if (hasFormatRule) { pFence -= 0.3; pPreamble -= 0.27; }
  if (isRetry) { pFence -= 0.3; pPreamble -= 0.3; pMathWrong -= 0.3; pBadCurrency -= 0.2; pMissingTracking -= 0.25; }

  const items = [
    { name: "藍色原子筆", unit_price: 25, qty: 12 },
    { name: "A4 影印紙", unit_price: 145, qty: 3 },
  ];
  const subtotal = items.reduce((a, i) => a + i.unit_price * i.qty, 0);
  const discount = 50;
  const correctTotal = subtotal - discount;

  const shipped = rnd() < 0.5;
  const body: any = {
    order_id: "PO-20260901-014",
    customer: "資工系學會",
    currency: rnd() < pBadCurrency ? (["NT$", "NTD", "台幣"][Math.floor(rnd() * 3)]) : "TWD",
    items,
    subtotal,
    discount,
    total: rnd() < pMathWrong ? correctTotal + Math.floor(rnd() * 200) + 10 : correctTotal,
    status: shipped ? "shipped" : "pending",
    order_date: "2026-09-01",
    ship_by: sticky() < 0.12 ? "2026-08-25" : "2026-09-05", // 沾黏：重試修不掉
  };
  if (shipped && rnd() >= pMissingTracking) body.tracking_no = "TW883120455";

  let out = JSON.stringify(body, null, 2);
  if (rnd() < pFence) out = "```json\n" + out + "\n```";
  if (rnd() < pPreamble) out = "好的，以下是從郵件中抽取出來的訂單資料：\n\n" + out;
  return out;
}
