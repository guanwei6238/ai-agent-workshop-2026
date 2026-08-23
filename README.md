# AI 應用實作課程

12 小時（4 節 × 3 小時），對象是 AI 技術應用社。2026/08/31–09/01。

**主軸**：LLM 只是個會猜下一個字的東西；讓它變成「能交付的系統」的，是你在它外面搭的回饋迴路。

```
節 1  派工跟問答差在哪   → agent 能做什麼、你要給它什麼
節 2  它有什麼工具與規矩 → AGENTS.md / skill / 工具 / 迴路
節 3  它看得到什麼       → RAG、產品接法、成本與資安
節 4  你怎麼確認它對     → 驗證、eval，以及不要全部 vibe coding
```

## 這個 repo 有什麼

| 目錄 | 內容 |
| --- | --- |
| [`syllabus.md`](syllabus.md) | 課綱。四節的分鐘級時間表、每個 Lab 的設計與驗收、風險與備援 |
| [`slides/`](slides/) | Typst 講義，四份共 140 頁（學生版）。講師版與學生版 |
| [`slides/scripts/`](slides/scripts/) | **上台用的演講稿**，四份，逐頁對應學生版 PDF |
| [`labs/`](labs/) | 七個可執行的 Lab。Node 24 直接跑 `.ts`，不需 `npm install` |
| [`docs/`](docs/) | 怎麼編譯、怎麼跑、課前要準備什麼 |

## 快速開始

```bash
# 編譯全部講義
cd slides && ./build.sh && ./build.sh --student

# 跑一個 Lab（用假模型，不花額度、不用網路）
cd labs/lab7-validation
node run.ts --version v1 --n 10 --backend mock
node report.ts
```

要用真的模型：到 <https://opencode.ai/auth> 拿 key（不需要信用卡），
然後 `export OPENCODE_API_KEY=sk-...`。

## 工具鏈

- **講義**：[Typst](https://typst.app) 0.15，自足式樣式，離線可編譯
- **Agent**：[pi](https://github.com/earendil-works/pi)（`@earendil-works/pi-coding-agent`）
- **模型**：[OpenCode Zen](https://opencode.ai/zen) 的免費模型
- **Lab**：Node 24 原生執行 TypeScript，零依賴

## 下一步

課前彩排清單在 [`docs/before-class.md`](docs/before-class.md)。
**最該先驗的是 `labs/lab4-loop/guard/env-guard.ts` 能不能真的載進 pi** ——
它的比對邏輯有測試，但與 pi 的接縫還沒實機驗證過，接錯了會靜默失效。
