#!/usr/bin/env bash
# 把資料還原成初始狀態。實驗搞亂了就跑這個。
cd "$(dirname "$0")" && node seed.ts
