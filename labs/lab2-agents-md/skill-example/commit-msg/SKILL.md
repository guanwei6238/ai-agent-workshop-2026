---
name: commit-msg
description: 產生符合本專案格式的 commit message。當使用者要 commit、要寫 commit 訊息、或問「這次改動的 commit 怎麼寫」的時候使用。
---

# 產生 commit message

## 步驟

1. 跑 `git diff --staged`。如果沒有東西，先跑 `git diff` 看未暫存的改動。
2. 判斷這次改動屬於哪一類：`feat` / `fix` / `refactor` / `docs` / `test`。
3. 照下面的格式寫，**只輸出訊息本身**，不要加說明、不要包 code fence。

## 格式

```
<類型>: <一句話，動詞開頭，不超過 50 字>

<為什麼要改。不要複述 diff 在做什麼——那個看 diff 就知道了。>
```

## 範例

```
refactor: 把成績權重抽成具名常數

原本 0.3 / 0.3 / 0.4 散在 calc.ts 各處，改權重要三個地方一起改，
漏一個不會有任何錯誤訊息。
```

## 不要做的事

- 不要寫「更新程式碼」「修正問題」這種沒有資訊的句子
- 不要在標題行結尾加句號
- 不要提到 AI 或這個 skill
