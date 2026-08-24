# Lab 2：AGENTS.md + Skill

> **目標**：親手證明「有沒有寫規範」會產生不同的程式碼，
> 以及**寫了也不一定照做**。

## 素材

`grades/` 是一個**能跑但很醜**的成績計算工具，只有兩個 `.ts` 檔。

```bash
cd grades
bash init.sh          # git repo + 存一份重構前的報表當基準
node report.ts
```

`init.sh` 會把重構前的輸出存成 `baseline.txt`。
每次重構完都要比對，確認**功能沒被改壞**：

```bash
node report.ts | diff baseline.txt -      # 沒有輸出就是一模一樣
```

先看一眼 `calc.ts`。它到處是 `any`、英文的廢話註解、`+` 串字串、
散落的魔術數字、大駝峰的 `Load` 函式。**但它會動。**

### 沒寫過 TypeScript？不影響

**你不需要看懂這段程式在算什麼。** 六條規則裡有五條是「用眼睛找得到」的樣子：

| 規則 | 違規長這樣 | 遵守長這樣 |
| --- | --- | --- |
| R1 不用 `any` | `function calc(d: any)` | `function calc(d: Course)` |
| R2 匯出函式小駝峰 | `export function Load()` | `export function loadData()` |
| R3 用 template literal | `"avg: " + s.avg` | `` `avg: ${s.avg}` `` |
| R4 數字抽成常數 | `score = hw * 0.3` | `score = hw * W_HOMEWORK` |
| R6 匯出函式有說明 | （上面一片空白） | `// 算出總分與等第` |

而且 `check.ts` 會幫你數。**你要判斷的是「違規數有沒有變小」**，
功能有沒有被改壞則交給 `diff baseline.txt`。兩件事都不用你讀懂邏輯。

> R5「註解要說明為什麼」不在上表——那條**沒有任何程式擋得住**，只能人工看。
> 這正是 Lab 4 要回答的問題。

## 步驟

### 1. 基準：不給規範

```bash
cd grades
pi --provider opencode --model nemotron-3.5-lightning-free -a \
   -p "重構 calc.ts 與 report.ts，讓它們好讀一點"
git diff        # 或直接看檔案
```

**記錄它自作主張了什麼。** 它改的方向是它自己的品味，不是你的。

### 2. 加約束

```bash
./restore.sh                       # 還原程式碼（連 agent 新增的檔一起清）
cp ../AGENTS.example.md AGENTS.md
```

用**完全相同的指令**再跑一次，比較兩份 diff。

### 3. 測遵守率 ← 這一步最重要

同一份 `AGENTS.md`、同一句指令，**連跑三次**，每次用檢查器算違規：

```bash
node ../../lab4-loop/check.ts .
```

填 `compliance-sheet.md`。

> 起始違規數：R1=5　R2=1　R3=5　R4=7　R6=2（**兩個檔案加起來 20 個**）

> ⚠️ **兩個檔案都要指定。** 只說「重構 calc.ts」的話，`report.ts` 不會被動到——
> 檢查器掃的是整個目錄，你會以為它沒改好，其實是它照你說的做。

### 4. 抽成 skill（進階）

`AGENTS.md` 是「每次都要遵守的」；有些東西是「偶爾才做一次的」，
那種應該做成 skill。

試著把「產生本專案格式的 commit message」寫成 skill，用 `/skill:` 呼叫。

**檔案結構與範例在 [`skill-example/`](skill-example/)** —— 含 frontmatter 欄位說明，
以及一份可以直接跑的 `commit-msg/SKILL.md`。

```bash
mkdir -p .pi/skills
cp -r ../skill-example/commit-msg .pi/skills/
pi                      # 進去之後打 /skill:commit-msg
```

> ⚠️ pi 的 skill 只有**描述**常駐 context，全文要靠模型自己去讀，
> 而它常常不會這麼做。**用 `/skill:名字` 強制呼叫**，不要等它自己想到。
>
> 另外：`pi -p` 非互動模式預設會忽略專案內的 skill。
> 先跑一次互動模式 `/trust`，或加 `-a`。

## 驗收

**基礎**　你能展示有／無 `AGENTS.md` 的兩份 diff 差異，並說得出各規則的遵守率。

**進階**　全域 / 專案 / 子目錄三層各寫一份，**故意讓它們互相衝突**，實測誰贏。
（pi 的順序是：全域 → 各層父目錄 → 當前目錄；某目錄若有 `AGENTS.override.md` 則取代而非疊加。）

## 提示

送出執行之後不要乾等——同時去分析上一份 diff。
