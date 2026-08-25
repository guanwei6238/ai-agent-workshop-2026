# 進階：把迴路做成 pi extension

`loop.ts` 是外部迴路——它在 agent **跑完之後**才檢查。
真正的 hook 應該在 agent **每次寫檔的當下**就攔截。

pi 沒有**設定檔式**的 hook（官方明文的設計取捨：核心保持極小），
但 extension 可以監聽完整的工具生命週期：

| 事件 | 時機 | 能擋 | 能改參數 | 能改結果 |
| --- | --- | --- | --- | --- |
| `tool_execution_start` | 執行前 | ✗ | ✗ | ✗ |
| **`tool_call`** | **執行前** | **✓** | **✓** | ✗ |
| `tool_execution_update` | 執行中 | ✗ | ✗ | ✗ |
| **`tool_result`** | 執行後 | ✗ | ✗ | **✓** |
| `tool_execution_end` | 執行後 | ✗ | ✗ | ✗ |

要**擋**用 `tool_call`（見 `../guard/env-guard.ts`）。
要在事後把檢查結果餵回去，用 `tool_result`：

```
tool_result 事件
  → 如果這次是寫檔工具
  → 跑 check.ts
  → 沒過就改寫 result，設 isError，把違規內容塞進去
  → 模型下一輪就會看到，並且自己修
```

差別在哪：

| | `loop.ts`（外部迴路） | extension（內部 hook） |
| --- | --- | --- |
| 何時檢查 | agent 整輪跑完後 | 每次寫檔當下 |
| 模型知不知道 | 要重新開一輪告訴它 | 同一輪內就看到 |
| 花的 token | 多（要重述 context） | 少 |
| 實作成本 | 30 行 shell | 要寫 TS、要懂 pi 的事件模型 |

課堂上用 `loop.ts` 那個笨版本，是因為**機制透明**——你看得到「錯誤訊息被字串接回去」
這件事實際發生。看懂之後再寫 extension 就很簡單。

參考：pi 的 `docs/extensions.md`，以及生態系裡的 `pi-yaml-hooks`。
