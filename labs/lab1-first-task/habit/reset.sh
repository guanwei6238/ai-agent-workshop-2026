#!/usr/bin/env bash
# 把資料還原成種子狀態。實驗搞亂了就跑這個。
cd "$(dirname "$0")" && cp habits.seed.json habits.json && echo "已還原 habits.json"
