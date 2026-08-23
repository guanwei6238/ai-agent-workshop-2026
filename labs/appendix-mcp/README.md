# 附錄：MCP（課後自習）

課堂上這一段只有講述 + 講師 demo，沒有動手。原因寫在下面。

## pi 沒有內建 MCP

pi 官方文件明文寫著：它**刻意不內建** MCP、subagent、permission popup、plan mode。
核心保持極小，其他靠 extension。

這不是缺陷，是設計取捨。換個工具（Claude Code、Cursor），MCP 就是內建的。

**所以「這個功能怎麼用」永遠要看你手上是哪個工具。**
這正是節 2 開場那句話——概念相同，實作各異。

## 路線 A：裝現成的 MCP extension

```bash
pi install npm:@spences10/pi-mcp
```

然後照該 extension 的說明設定一個 MCP server。
建議從 filesystem 或 SQLite 開始——**離線可跑**，不用申請任何東西。

接通之後驗證：讓 agent 讀到一個它原本讀不到的檔案，並貼出那次的輸出。

## 路線 B：不碰 MCP，直接寫一個工具（推薦先做這個）

如果目標只是體感「**說給模型聽** vs **真的去執行**」的差別，
其實不需要 MCP——寫一個 pi extension 註冊兩個 tool 就夠了，
而且少一層 server 進程、少一個安裝步驟。

pi 的 extension 是 TypeScript 模組，大致長這樣：

```
註冊一個 tool
  ├─ 名字與說明   ← 模型靠這個決定要不要用
  ├─ 參數 schema  ← 模型照這個組參數
  └─ 實作         ← 真的去做事的地方
```

細節看 pi 的 `docs/extensions.md`。

## 兩者的差別

| | 自己寫 tool | MCP |
| --- | --- | --- |
| 要跑額外的進程 | 不用 | 要 |
| 跨工具通用 | 不行，綁 pi | **可以**，這是 MCP 的重點 |
| 上手成本 | 低 | 中 |
| 適合 | 只有你自己要用 | 要給別人／別的工具用 |

MCP 的價值在「**標準**」——寫一次 server，所有支援 MCP 的工具都能接。
如果你只是要給自己的 agent 加個能力，直接寫 tool 更快。

## 提醒

接上一個能改資料庫的 MCP，就等於給了 agent 改資料庫的權限。

**真的會執行 = 真的會出事。** 先從唯讀的開始。
