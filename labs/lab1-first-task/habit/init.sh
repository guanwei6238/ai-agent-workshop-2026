#!/usr/bin/env bash
# 把這個專案變成 git repo，這樣等一下才能用 git diff 看 agent 改了什麼。
set -e
cd "$(dirname "$0")"
[ -f habits.json ] || cp habits.seed.json habits.json
git init -q
git add -A
git -c user.name=lab -c user.email=lab@local commit -qm "初始狀態"
echo "✓ 好了。現在 git diff 看得到 agent 的改動，git checkout . 可以還原。"
