#!/usr/bin/env bash
# 驗證：agent 有沒有真的呼叫你註冊的工具。
#
#   ./verify.sh              測你自己寫的 club-tool.ts
#   ./verify.sh solution     測參考解
#
# 免費模型不穩定，就算 description 寫對了也不保證每次都呼叫，
# 所以最多試 3 次，成功一次就算過。
set -uo pipefail
cd "$(dirname "$0")"

EXT="../club-tool.ts"
[ "${1:-}" = "solution" ] && EXT="../solution/club-tool.ts"

MODEL="${ZEN_MODEL:-nemotron-3.5-lightning-free}"
Q="我等一下想去社辦寫扣，E205 現在方便嗎？"
TRIES="${TRIES:-3}"

echo "  問題：$Q"
echo "  工具：$EXT"
echo "  模型：$MODEL"
echo "  （一次呼叫大約 20–40 秒）"
echo

for i in $(seq 1 "$TRIES"); do
  echo "  ── 第 $i 次 ──────────────────────────"
  OUT=$(cd workspace && timeout 300 pi --provider opencode --model "$MODEL" \
          -e "$EXT" -a -p "$Q" 2>&1)
  echo "$OUT"
  echo

  # 這三樣只存在於 club-tool.ts 的資料裡。出現 = 工具真的被呼叫了。
  HIT=0
  for k in "器材長" "21:00" "3"; do
    grep -q -- "$k" <<<"$OUT" && HIT=$((HIT+1))
  done

  if [ "$HIT" -ge 2 ]; then
    echo "  ✓ 工具被呼叫了 —— 回答裡出現了只有工具查得到的資料（第 $i 次）"
    exit 0
  fi
  echo "  · 這次沒呼叫，再試一次"
  echo
done

echo "────────────────────────────────────────"
echo "  ✗ 試了 $TRIES 次都沒呼叫工具"
echo
echo "    它答不出「3 人 / 器材長 / 21:00」，代表它沒用你的工具。"
echo "    最可能的原因：description 太模糊，模型不知道什麼時候該用它。"
echo "    → 改 club-tool.ts 的 TODO 2，寫清楚「查得到什麼」與「什麼時候用」。"
echo "      TODO 1 的名字、TODO 3 的參數說明也都是給模型看的，一起改。"
exit 1
