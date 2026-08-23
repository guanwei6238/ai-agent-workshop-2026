#!/usr/bin/env bash
#
# Lab 4：最小可行的 loop engineering。
#
#   ./loop.sh "把 calc.ts 依照 AGENTS.md 重構"
#
# 做 → 檢查 → 把錯誤餵回去 → 再做。就這樣，沒有魔法。
#
set -uo pipefail
cd "$(dirname "$0")"

TARGET="${TARGET:-../lab2-agents-md/grades}"
MODEL="${ZEN_MODEL:-nemotron-3.5-lightning-free}"
MAX_RETRY="${MAX_RETRY:-3}"
TASK="${1:?用法：./loop.sh \"你要它做的事\"}"

run_agent() {  # $1 = prompt, $2 = 是否續接
  if [ "${2:-}" = "continue" ]; then
    (cd "$TARGET" && pi --provider opencode --model "$MODEL" -c -p "$1")
  else
    (cd "$TARGET" && pi --provider opencode --model "$MODEL" -p "$1")
  fi
}

echo "── 第 1 次：照你說的做 ──"
run_agent "$TASK" || { echo "agent 執行失敗"; exit 1; }

for i in $(seq 1 "$MAX_RETRY"); do
  echo
  echo "── 檢查（第 $i 輪）──"
  if OUT=$(node check.ts "$TARGET"); then
    echo "$OUT"
    echo
    echo "✓ 迴路結束：第 $i 輪通過。"
    exit 0
  fi
  echo "$OUT"

  if [ "$i" -eq "$MAX_RETRY" ]; then
    echo
    echo "! 試了 $MAX_RETRY 次還是沒過。這也是一種結果——把它記下來。"
    exit 1
  fi

  echo
  echo "── 把錯誤餵回去（第 $((i+1)) 次）──"
  # 關鍵在這裡：餵回去的必須是「具體的」錯誤，不是「格式錯誤」四個字。
  run_agent "剛才的修改沒有通過專案的規範檢查，違規如下：

$OUT

請依照 AGENTS.md 修好這些問題。只改必要的地方。" "continue" || exit 1
done
