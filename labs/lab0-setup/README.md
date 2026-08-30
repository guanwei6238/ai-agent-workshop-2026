# Lab 0：環境健檢

> 35 分鐘，四個步驟。**教室電腦不會預裝，全部當場自己來。**

## ① 裝 pi

到 <https://pi.dev/> 複製對應你系統的指令。

**Windows 11（教室電腦）**：

```powershell
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

它會順便問你要不要裝 Node —— **說要**。

**Linux / macOS**：

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

看到 `Pi was installed successfully` 就過了。

> ⚠️ **裝完一定要開一個新的終端機**，否則 `PATH` 不會生效 —— 這是最常見的卡關點。

## ② 拿一把 key

開 <https://opencode.ai/auth> 註冊／登入，複製 API key。

> **不需要填信用卡。** 這門課全程只用免費模型。

⚠️ 免費模型**會記錄你送出的內容**，有些條款寫明可能用於訓練模型。
這兩天所有 lab 的素材都是虛構的——**不要餵任何真實的個人資料**。

## ③ 把 key 接上 pi

在 pi 裡面登入，不用手動設定檔：

1. 終端機打 `pi`，進去之後輸入 `/login`
2. 選 **Sign in with an API key**
3. 選 **OpenCode Zen**
4. 貼上剛剛複製的 key

**驗收**：`pi` 開起來看得到模型名稱，不再出現 `No models available`。

> **登入一次就好。** 之後所有 lab 都走 `pi`，不需要設環境變數。

## ④ 確認它會回話

```bash
pi --provider opencode --model nemotron-3.5-lightning-free
```

進去之後**直接打字**：

```
用繁體中文回我一句 hello
```

按 Enter，看它回話。

> **為什麼不用 `pi -p "..."`？** `-p` 是非互動模式，跑完就結束，
> 你看不到它在做什麼。**這門課的重點就是「看它在做什麼」**，所以一律用互動模式。
>
> 離開打 `/exit` 或 Ctrl+C 兩次。

⚠️ **每次都要指定 `--model`**，不然它會用預設模型 —— 那可能是付費的。

**驗收**：終端機看得到模型的回覆。

`node check.ts` 會把上面四步一次檢查完。

## ⑤ 開 VS Code

後面所有 lab 都用 VS Code **看 agent 改了什麼**，不在終端機讀 diff。

```bash
cd labs/lab1-first-task/habit
code .          # 沒有 code 指令的話，直接用 VS Code 開這個資料夾
```

**驗收**：左側側欄有一個分支圖示（**原始檔控制**，`Ctrl+Shift+G`）。
現在點下去是空的——**因為還沒有人改東西**。Lab 1 讓 agent 改完之後再回來看。

> 沒裝 VS Code 的話現在裝：<https://code.visualstudio.com/>
> 不用裝任何擴充套件，diff 是內建的。

**提早裝完的人**：叫 pi 讀一份 CSV、輸出成 markdown 表格——那正好是等一下 1-C 的暖身。
做完的話，去幫旁邊還在裝的人，那是最快的除錯方式。

備用模型：`hy3-free`、`mimo-v2.5-free`。用 `--model` 換。

## 驗收

**基礎**　五步都過，`node check.ts` 全綠。

**進階（提早裝完的人）**　叫它讀一份 CSV，輸出成 markdown 表格：

```powershell
pi --provider opencode --model nemotron-3.5-lightning-free
```

進去之後輸入：

```
讀 labs/lab2-agents-md/grades/data.json，整理成一個 markdown 表格
```

**盯著看它做了什麼**——它會先 `read` 那個檔，再組表格。
那正是 Lab 1 要觀察的東西，先預習一次。

> 做完的請**去幫旁邊的人**。這兩天做得最快的那幾位，
> 幫同桌 debug 的那半小時學到的比自己做一小時多。

## 卡住了怎麼辦

**先往下走。** 只要步驟 ② 拿到了 key，Lab 5、6、7 都還能做，
那是全課最有價值的三個。安裝或登入的問題，午休時間講師會處理。

| 症狀 | 先試這個 |
| --- | --- |
| 找不到 `pi` 指令 | 重開終端機；確認安裝路徑有進 `PATH` |
| `No models available` | `/login` 還沒做完，或選錯 provider |
| 401 / 403 | key 貼錯或多了空白，重跑一次 `/login` |
| 429 / rate limit | 這把 key 的額度用完了。**先往下做**，Lab 5 / 6 / 7 都有 `--backend mock` 可以離線完成 |
| 模型回 502 / unavailable | 那個模型當下掛了，`--model` 換一個 |
| skill 寫好了卻沒作用 | 專案信任沒開。用 `-a`，或先跑一次互動模式 `/trust` |
| 回覆是亂碼或空白 | 換模型。免費模型的常態，不是你的錯 |

## 全部都不行的時候

每個 lab 都有 `mock` backend，完全離線、不花額度：

```powershell
node run.ts --version v1 --backend mock        # lab7
node ask.ts --both --backend mock "你的問題"    # lab5

$env:ZEN_BACKEND = "mock"                      # lab6：先設，再跑
node server.ts
```

那是假模型，數字不能當真，**但流程一模一樣**，課照上。
