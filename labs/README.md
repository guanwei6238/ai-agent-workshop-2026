# Lab 教材

全部用 **Node 24 直接跑 `.ts`**，不需要 `npm install`、不需要 `tsc`。

```bash
node --version      # 需要 22 以上
```

## 兩條總則

**一、學生一律「開 pi，然後打字」，不要 `pi -p`。**
`-p` 跑完就結束，看不到它呼叫了哪些工具、讀了哪些檔——
而那正是這門課要學生看的東西。

```bash
pi --provider opencode --model mimo-v2.5-free
```

開起來之後才輸入 prompt。**不需要 `-a`** —— `AGENTS.md` 與 `CLAUDE.md`
在信任判斷之前就會載入（pi 官方 `usage.md` 寫明，已實測）。
只有 `.pi/skills/` 這類專案內資源才需要信任，互動模式會直接問你。

`lab3/verify.ts`、`lab4/loop.ts`、`lab7/run.ts` 這些**腳本**內部用 `-p` 是對的——
那是自動化，不是學生在操作。

**二、所有指令都寫成 PowerShell 能跑的形式。**
教室是 Win11。所以：**不用 `&&` 串接**（Windows PowerShell 5.1 不支援）、
**不用反斜線續行**、**不用 `mkdir -p`**、環境變數一律寫成 `$env:X = "y"` 再換行下指令。
`cd`、`cp`、`ls`、`cat` 在 PowerShell 有對應的 alias，可以照用。

**三、看改動用 VS Code，不要在終端機讀 `git diff`。**
`Ctrl+Shift+G` 開原始檔控制，點檔案就有左右並排的比對。
`init.ts` 已經建好 git repo，**學生不需要會用 git**。

---

**所有腳本都是 `.ts`，用 `node xxx.ts` 跑。**
教室是 Windows 11，學生在 PowerShell 裡打指令 —— `.sh` 在那裡不會動，
而 `node` 在三個平台上行為一模一樣。跨平台的小工具收在 `shared/sh.ts`。

## 開始之前

先照 [lab0-setup](lab0-setup/) 裝好 pi 並 `/login` 登入一次。
**之後所有 lab 都透過 `pi` 呼叫，不需要設 API key。**

```bash
# 選用。所有腳本預設用 mimo-v2.5-free
# PowerShell（教室用這個）——設一次，之後這個視窗都有效
$env:ZEN_MODEL = "laguna-s-2.1-free"

# Mac / Linux
export ZEN_MODEL=laguna-s-2.1-free
cd lab0-setup
node check.ts
```

## 一覽

| Lab | 節次 | 分鐘 | 主題 | 需要 |
| --- | --- | --- | --- | --- |
| [lab0-setup](lab0-setup/) | 1 | 35 | 從零裝到跑通 | — |
| [lab1-first-task](lab1-first-task/) | 1 | 60 | 用 agent 做一個真的功能 | pi |
| [lab2-agents-md](lab2-agents-md/) | 2 | 60 | AGENTS.md + skill，量遵守率 | pi |
| [lab3-tools](lab3-tools/) | 2 | ~20 | 給 agent 一個它本來沒有的工具 | pi |
| [lab4-loop](lab4-loop/) | 2 | 30 | 做→檢查→餵回去→再做 | Lab 2 |
| [lab5-rag](lab5-rag/) | 3 | 50 | 最小 RAG | pi |
| [lab6-product](lab6-product/) | 3 | 49 | 把 LLM 放進產品 | pi |
| [lab7-validation](lab7-validation/) | 4 | 60 | 輸出驗證器 | pi |
| [appendix-mcp](appendix-mcp/) | — | — | MCP（課後自習） | pi |

> Lab 3 教的是「自己寫一個工具」，那是 MCP 想解決的同一件事、但少一層 server。
> **MCP 本身**（pi 核心刻意不內建）改成課後自習，見 `appendix-mcp/README.md`。

## 哪些能離線跑

| Lab | 離線可行嗎 |
| --- | --- |
| lab5 / lab7 | ✓ 完整支援 `mock` |
| lab6 | △ 步驟 1–3 可以；**步驟 4（互相攻擊）需要真模型** |
| lab1 / lab2 / lab3 / lab4 | ✗ **需要 pi**，沒有 mock 路徑 |

支援的部分這樣跑：

```powershell
node run.ts --version v1 --backend mock       # lab7
node ask.ts --both --backend mock "你的問題"   # lab5

$env:ZEN_BACKEND = "mock"                     # lab6：先設，再跑
node server.ts
```

> Mac / Linux：`ZEN_BACKEND=mock node server.ts` 可以寫成一行。

假模型的行為是**模擬**，數字不能拿來宣稱真模型的表現。
但流程一模一樣，網路掛掉課照上。

## 共用的東西

`shared/zen-client.ts` 是所有 lab 呼叫模型的入口，三個 backend：

| backend | 怎麼做 | 什麼時候用 |
| --- | --- | --- |
| `cli`（預設） | 跑 `pi --provider opencode --model … -p` | **平常都用這個**。走 pi 的登入，不用環境變數 |
| `http` | 直接 `fetch` Zen 的 API | Lab 6 步驟 2 示範「Server + API key」；也是 pi 壞掉時的備援。要 `OPENCODE_API_KEY` |
| `mock` | 本機假模型 | 離線、省額度、課前彩排 |

**為什麼預設走 `cli`**：學生在 Lab 0 已經 `/login` 過了，走 pi 就不用再處理 API key，
少一個出錯點。而且直接裸打 API 的匿名額度非常低（實測第 2、3 次就被擋，且是以「天」計）——
Lab 6 步驟 2 會刻意讓你撞一次，那本身就是教材。

## 給講師

`INSTRUCTOR.md` 在 lab3、lab5、lab7 裡，包含參考解答與實測數據。
發給學生前記得先確認要不要一起發。
