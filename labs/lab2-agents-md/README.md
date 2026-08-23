# Lab 2：AGENTS.md + Skill

> **目標**：親手證明「有沒有寫規範」會產生不同的程式碼，
> 以及**寫了也不一定照做**。

## 素材

`grades/` 是一個**能跑但很醜**的成績計算工具，只有兩個 `.ts` 檔。

```bash
cd grades && node report.ts
```

先看一眼 `calc.ts`。它到處是 `any`、英文的廢話註解、`+` 串字串、
散落的魔術數字、大駝峰的 `Load` 函式。**但它會動。**

## 步驟

### 1. 基準：不給規範

```bash
cd grades
pi --provider opencode --model mimo-v2.5-free -p "重構 calc.ts，讓它好讀一點"
git diff        # 或直接看檔案
```

**記錄它自作主張了什麼。** 它改的方向是它自己的品味，不是你的。

### 2. 加約束

```bash
cd grades && git checkout .        # 還原
cp ../AGENTS.example.md AGENTS.md
```

用**完全相同的指令**再跑一次，比較兩份 diff。

### 3. 測遵守率 ← 這一步最重要

同一份 `AGENTS.md`、同一句指令，**連跑三次**，每次用檢查器算違規：

```bash
node ../../lab4-loop/check.ts .
```

填 `compliance-sheet.md`。

> 起始違規數：R1=5　R2=1　R3=5　R4=8　R6=2

### 4. 抽成 skill（進階）

`AGENTS.md` 是「每次都要遵守的」；有些東西是「偶爾才做一次的」，
那種應該做成 skill。

試著把「產生本專案格式的 commit message」寫成 skill，用 `/skill:` 呼叫。

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
