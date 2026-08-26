# Skill 範例：本專案格式的 commit message

Lab 2 步驟 4（進階）的範本。**照抄可以跑，但建議改成你自己專案的格式。**

## 檔案結構

一個 skill 就是**一個資料夾，裡面有一個 `SKILL.md`**。其他都是選配。

```
commit-msg/
└── SKILL.md          ← 唯一必要的檔案
```

比較完整的長這樣：

```
my-skill/
├── SKILL.md          ← 必要：frontmatter + 說明
├── scripts/          ← 選配：它可以去跑的腳本
│   └── process.sh
├── references/       ← 選配：需要時才讀的細節文件
│   └── api.md
└── assets/           ← 選配：樣板、範例檔
    └── template.json
```

`SKILL.md` 裡用**相對路徑**指到這些檔案，例如 `見 references/api.md`。

## `SKILL.md` 的 frontmatter

開頭那兩行 `---` 中間的部分。**只有兩個欄位是必填的**：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `name` | ✓ | 最多 64 字。**只能用小寫英文、數字、連字號**。`pdf-tools` 可以，`PDF_Tools` 不行 |
| `description` | ✓ | 最多 1024 字。**寫清楚「做什麼」和「什麼時候用」** |
| `license` | | 授權 |
| `compatibility` | | 環境需求 |
| `disable-model-invocation` | | 設 `true` 就只能用 `/skill:` 手動叫，模型不會自己想到 |

> **缺 `description` 的 skill 不會被載入**，這是唯一會直接失敗的錯誤。
> 其他違規（名字太長、有大寫）只會警告，還是會載入。

## 這整套機制叫「漸進式揭露」

pi 官方文件用的詞是 **progressive disclosure**，運作分三步：

```
啟動時                 模型自己判斷            要用才讀
掃過所有 skill    →    「這件事該不該用   →   用讀檔工具把
只把 name +            這個 skill？」          SKILL.md 全文
description 放                                 拉進來
進 context
```

**一百個 skill 的常駐成本，等於一百行描述——不是一百份文件。**
這就是它能一直長大而不吃掉 context 的原因。

代價在第二步：**判斷是模型做的，而它不一定會讀。**

## `description` 為什麼是關鍵

因為常駐的只有它。它就是模型判斷「這件事該不該用這個 skill」的唯一依據。

```yaml
# 好
description: 從 PDF 抽出文字與表格、填 PDF 表單、合併多個 PDF。處理 PDF 文件時使用。

# 不好
description: 處理 PDF。
```

> 這件事跟 **Lab 3 的工具 description** 是同一個道理，也是同一個坑：
> 寫得模糊，它就不會用；而且**不會有任何錯誤訊息告訴你**。

## 放在哪裡

| 位置 | 範圍 |
| --- | --- |
| `~/.pi/agent/skills/` | 全域，所有專案 |
| `.pi/skills/` | 這個專案（**專案要先 `/trust`**） |
| `.agents/skills/` | 這個專案，跨工具通用的位置 |
| `--skill <path>` | 指定單一路徑，可重複 |

```bash
mkdir -p .pi/skills
cp -r ../skill-example/commit-msg .pi/skills/
```

## 怎麼呼叫

```
/skill:commit-msg
/skill:commit-msg 只看 calc.ts 的改動      ← 參數會接在 skill 內容後面
```

> ⚠️ pi 官方文件寫明「models don't always do this」——
> 它**不一定**會自己想到要讀 skill 全文。
> Lab 2 的驗收因此定為：**用 `/skill:` 明確呼叫並成功**。
>
> 另外：`.pi/skills/` 是專案內資源，**pi 啟動時會問你要不要信任這個資料夾**，
> 要說「是」才會載入。`pi -p` 非互動模式不會問，預設就是忽略——
> 這也是課堂上一律用互動模式的原因之一。
