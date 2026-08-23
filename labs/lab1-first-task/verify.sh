#!/usr/bin/env bash
#
# 檢查 agent 做出來的 streak 指令有沒有符合 SPEC.md。
#
#   ./verify.sh
#
# 每一項都是可以自己跑的指令，不用憑感覺judge。
set -uo pipefail
cd "$(dirname "$0")/habit"

G="\033[32m"; R="\033[31m"; D="\033[2m"; N="\033[0m"
PASS=0; FAIL=0
check() { # $1=描述 $2=結果(0/1) $3=實際值
  if [ "$2" = 0 ]; then echo -e "  ${G}✓${N} $1"; PASS=$((PASS+1))
  else echo -e "  ${R}✗${N} $1"; [ -n "${3:-}" ] && echo -e "      ${D}${3}${N}"; FAIL=$((FAIL+1)); fi
}

node seed.ts >/dev/null 2>&1
OUT=$(node src/cli.ts streak 2>&1); RC=$?

echo
echo "── 使用方法 ──"
check "不給參數就能跑，不報錯" "$([ $RC -eq 0 ] && echo 0 || echo 1)" "$OUT"

echo "── 輸出內容 ──"
for h in 早起 讀論文 運動; do
  check "列出了「$h」" "$(echo "$OUT" | grep -q "$h" && echo 0 || echo 1)"
done

echo "── 邊界 ──"
check "早起 = 4（今天有做）"       "$(echo "$OUT" | grep -qE '早起.*\b4\b' && echo 0 || echo 1)" "$OUT"
check "讀論文 = 2（今天沒做，從昨天算）" "$(echo "$OUT" | grep -qE '讀論文.*\b2\b' && echo 0 || echo 1)" "$OUT"
check "運動 = 0（完全沒紀錄）"      "$(echo "$OUT" | grep -qE '運動.*\b0\b' && echo 0 || echo 1)" "$OUT"

echo "── 沒有多做 ──"
S=src/commands/streak.ts
EXTRA=0
echo "$OUT" | grep -q '最長' && EXTRA=1
# 只看程式碼，不看註解——註解裡寫「不是最長連續」不算多做
[ -f "$S" ] && sed -E 's://.*::' "$S" | grep -vE '^\s*(/\*|\*)' | grep -qiE '最長|longest' && EXTRA=1
check "沒有算「最長連續」" "$EXTRA" "輸出或原始碼裡出現了「最長 / longest」"

echo "── 有沒有跟上專案寫法 ──"
if [ -f "$S" ]; then
  check "開在 src/commands/ 底下" 0
  check "有在 cli.ts 註冊"      "$(grep -q 'streak' src/cli.ts && echo 0 || echo 1)"
  check "用 ui.ts 的函式，沒有直接 console.log" "$(grep -q 'console\.log' "$S" && echo 1 || echo 0)"
  check "用 date.ts 的 helper"  "$(grep -qE 'shift|diffDays' "$S" && echo 0 || echo 1)"
  check "沒有用 any"            "$(grep -q '\bany\b' "$S" && echo 1 || echo 0)"
  UNUSED=$(node ../check-imports.ts "$S" 2>/dev/null)
  check "沒有沒用到的 import" "$([ -z "$UNUSED" ] && echo 0 || echo 1)" "沒用到：$UNUSED"
else
  check "開在 src/commands/streak.ts" 1 "找不到這個檔"
fi

echo
echo "  ${PASS} 項通過，${FAIL} 項沒過"
if [ "$FAIL" -eq 0 ]; then echo "  全部符合規格。"; else echo "  把沒過的那幾項記到檢核表上。"; fi
echo
exit "$FAIL"
