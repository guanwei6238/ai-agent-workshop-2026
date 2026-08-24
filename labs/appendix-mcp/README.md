# 附錄：MCP（課後自習）

課堂上 **Lab 3 已經動手寫過一支工具**（`../lab3-tools/`）——
那是 MCP 想解決的同一件事，但少一層 server 進程。

這份附錄講的是 **MCP 本身**：為什麼 pi 不內建、要怎麼接、跟自己寫工具差在哪。

## pi 沒有內建 MCP

pi 官方文件明文寫著：它**刻意不內建** MCP、subagent、permission popup、plan mode。
核心保持極小，其他靠 extension。

這不是缺陷，是設計取捨。換個工具（Claude Code、Cursor），MCP 就是內建的。

**所以「這個功能怎麼用」永遠要看你手上是哪個工具。**
這正是節 2 開場那句話——概念相同，實作各異。

## 路線 A：自己寫一個真的 MCP server（推薦，而且不需要 pi）

**[`python/`](python/) 有可以直接跑的完整範例**——一個 20 行的 Python MCP server，
加一支 client 探測程式，把 `initialize` → `tools/list` → `tools/call` 每一步印出來。

```bash
cd python && python3 -m venv venv && ./venv/bin/pip install mcp
./venv/bin/python probe.py
```

Python 的 SDK 是所有語言裡樣板最少的：**docstring 自動變成 description、
type hint 自動變成 schema**。

## 路線 B：裝現成的 MCP extension

```bash
pi install npm:@spences10/pi-mcp
```

然後照該 extension 的說明設定一個 MCP server。
建議從 filesystem 或 SQLite 開始——**離線可跑**，不用申請任何東西。

接通之後驗證：讓 agent 讀到一個它原本讀不到的檔案，並貼出那次的輸出。

## 路線 C：不碰 MCP，直接寫一個工具

> **課堂上的 Lab 3 就是這條路線**，素材在 `../lab3-tools/`。
> 還沒做完的話先去做那個，再回來看路線 A。

## 三條路的差別

| | A 寫 MCP server | B 裝現成 extension | C 寫 pi tool（Lab 3） |
| --- | --- | --- | --- |
| 需要 pi | **不需要** | 需要 | 需要 |
| 要跑額外的進程 | 要 | 要 | 不用 |
| 語言 | 任何 | — | 只能 TS/JS |
| 跨工具通用 | **可以** | 可以 | 不行，綁 pi |
| 已驗證可跑 | ✓ | 未測 | ✓ |

MCP 的價值在「**標準**」——寫一次 server，所有支援 MCP 的工具都能接。
如果你只是要給自己的 agent 加個能力，直接寫 tool 更快。

## 提醒

接上一個能改資料庫的 MCP，就等於給了 agent 改資料庫的權限。

**真的會執行 = 真的會出事。** 先從唯讀的開始。
