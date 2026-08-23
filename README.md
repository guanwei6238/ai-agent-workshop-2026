# AI 應用實作課程

12 小時的動手課，主題是**怎麼用 AI 做實際開發**。

> LLM 只是個會猜下一個字的東西；讓它變成能交付的系統的，是你在它外面搭的回饋迴路。

## 這裡有什麼

| 目錄 | 內容 |
| --- | --- |
| [`slides/`](slides/) | 四份講義 PDF，對應四節課 |
| [`labs/`](labs/) | 七個可執行的 Lab |

## 開始之前

只需要兩樣東西，**都在 Lab 0 裡帶你裝**：

1. **pi**（coding agent）—— Windows 一行 PowerShell，會順便問你要不要裝 Node
2. **一把 OpenCode Zen 的 key** —— 免費，不用信用卡

```powershell
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

詳細步驟見 [`labs/lab0-setup/`](labs/lab0-setup/)。

## Lab 一覽

| Lab | 節次 | 主題 |
| --- | --- | --- |
| [lab0-setup](labs/lab0-setup/) | 1 | 從零裝到跑通 |
| [lab1-first-task](labs/lab1-first-task/) | 1 | 用 agent 做一個真的功能 |
| [lab2-agents-md](labs/lab2-agents-md/) | 2 | 寫 `AGENTS.md`，量它到底聽不聽話 |
| [lab4-loop](labs/lab4-loop/) | 2 | 做 → 檢查 → 把錯誤餵回去 → 再做 |
| [lab5-rag](labs/lab5-rag/) | 3 | 最小 RAG |
| [lab6-product](labs/lab6-product/) | 3 | 把 LLM 放進產品，然後親手把 key 抓出來 |
| [lab7-validation](labs/lab7-validation/) | 4 | 輸出驗證器 —— 用數據證明 prompt 改對了 |
| [appendix-mcp](labs/appendix-mcp/) | — | MCP（課後自習） |

> Lab 3 不在課堂上，原因見 [`labs/appendix-mcp/`](labs/appendix-mcp/)。

## 全部都能離線跑

每個會呼叫模型的 Lab 都有 `mock` backend —— 假模型、不花額度、不用網路：

```bash
node run.ts --version v1 --n 10 --backend mock     # lab7
node ask.ts --both --backend mock "你的問題"        # lab5
ZEN_BACKEND=mock node server.ts                    # lab6
```

數字不能當真，但流程一模一樣。網路掛了課照上。

## 技術需求

- **Node 22 以上** —— 所有 Lab 直接跑 `.ts`，不需要 `npm install`，不需要 `tsc`
- **pi** —— Lab 1、2、4 需要
- Windows 上 pi 需要 bash shell，裝 [Git for Windows](https://git-scm.com/download/win) 即可
