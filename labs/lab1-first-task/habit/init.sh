#!/usr/bin/env bash
# 把這個專案變成 git repo，並產生種子資料。
# 這樣等一下才能用 git diff 看 agent 改了什麼、用 git checkout . 還原。
set -e
cd "$(dirname "$0")"
node seed.ts
git init -q
git add -A
git -c user.name=lab -c user.email=lab@local commit -qm "初始狀態"
echo "✓ 好了。git diff 看得到 agent 的改動，git checkout . 可以還原。"
