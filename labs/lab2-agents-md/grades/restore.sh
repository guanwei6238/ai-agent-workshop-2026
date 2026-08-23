#!/usr/bin/env bash
# 還原成初始狀態，準備跑下一次。
# git clean -fd 會刪掉 agent 新增的檔案，這是故意的。
set -e
cd "$(dirname "$0")"
git checkout . 2>/dev/null || true
git clean -fdq -e baseline.txt 2>/dev/null || true
echo "✓ 已還原"
