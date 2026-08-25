# habit

一個很小的習慣追蹤 CLI。不需要 `npm install`。

```bash
node src/cli.ts add 早起        # 新增習慣
node src/cli.ts done 早起       # 記錄今天完成
node src/cli.ts done 早起 2026-08-20
node src/cli.ts list            # 列出所有習慣
```

資料存在 `habits.json`。**`node restore.ts` 一次還原程式碼與資料**——
它會 `git clean -fd`，把 agent 新增的檔案（例如 `src/commands/streak.ts`）也刪掉。
只用 `git checkout .` 刪不掉那些新檔，第二次就比不出差別。

## 結構

```
src/
├── cli.ts             進入點，指令表在這裡
├── errors.ts          UserError
├── ui.ts              所有輸出都經過這裡
├── date.ts            日期一律用 YYYY-MM-DD 字串
├── store.ts           資料存取，其他檔案不碰檔案系統
└── commands/          一個指令一個檔，都 export run(args)
    ├── add.ts
    ├── done.ts
    └── list.ts
```
