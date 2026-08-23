#!/usr/bin/env bash
# 變成 git repo，並存一份重構前的報表輸出當基準。
# 沒有這個，等一下的 git diff 與還原都做不了。
set -e
cd "$(dirname "$0")"
node report.ts > baseline.txt
git init -q
git add -A
git -c user.name=lab -c user.email=lab@local commit -qm "初始狀態"
echo "✓ 好了。git diff 看得到改動，./restore.sh 可以還原。"
echo "  baseline.txt 存的是重構前的報表 —— 重構後要跟它一模一樣。"
