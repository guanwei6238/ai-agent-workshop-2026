#!/usr/bin/env bash
#
# Lab 0 環境健檢。分成兩關，分開檢查——因為它們的失敗後果不一樣。
#
#   ./check.sh
#
set -uo pipefail
cd "$(dirname "$0")"

G="\033[32m"; R="\033[31m"; Y="\033[33m"; D="\033[2m"; N="\033[0m"
ok(){ echo -e "  ${G}✓${N} $1"; }
no(){ echo -e "  ${R}✗${N} $1"; }
tip(){ echo -e "    ${D}$1${N}"; }

PASS_A=1; PASS_B=1

echo
echo "══ 基本環境 ══"

if command -v node >/dev/null 2>&1; then
  V=$(node -p "process.versions.node.split('.')[0]")
  if [ "$V" -ge 22 ]; then ok "Node $(node -v)（可以直接跑 .ts）"
  else no "Node $(node -v) 太舊，需要 22 以上"; tip "這些 lab 直接執行 .ts，不經過編譯"; PASS_A=0; fi
else
  no "找不到 node"; PASS_A=0
fi

if [ -n "${OPENCODE_API_KEY:-}" ]; then
  ok "OPENCODE_API_KEY 有設（${OPENCODE_API_KEY:0:6}…）— 備援路徑可用"
else
  echo -e "  ${D}·${N} OPENCODE_API_KEY 沒設 —— ${D}正常，所有 lab 都走 pi${N}"
  tip "只有在 pi 壞掉、要改用 ZEN_BACKEND=http 時才需要它"
fi

echo
echo "══ pi：裝好、登入、會回話 ══"

if command -v pi >/dev/null 2>&1; then
  ok "pi 有裝（$(pi --version 2>/dev/null | head -1 || echo '版本未知')）"
else
  no "找不到 pi"
  tip "到 https://pi.dev/ 複製指令，或直接跑："
  tip "curl -fsSL https://pi.dev/install.sh | sh"
  PASS_B=0
fi

if [ "$PASS_A" = 1 ] && [ "$PASS_B" = 1 ]; then
  MODEL="${ZEN_MODEL:-nemotron-3.5-lightning-free}"
  echo -e "  ${D}試打一次 $MODEL …${N}"
  if OUT=$(timeout 90 pi --provider opencode --model "$MODEL" -p "只回覆兩個字：成功" 2>&1); then
    ok "模型有回應：$(echo "$OUT" | head -1 | cut -c1-40)"
  else
    no "呼叫失敗"
    echo "$OUT" | head -3 | sed 's/^/      /'
    tip "No models available → pi 裡面還沒 /login"
    tip "429 → 額度用完，舉手換 key"
    tip "502/unavailable → 換模型：ZEN_MODEL=hy3-free ./check.sh"
    PASS_B=0
  fi
fi

echo
echo "══ 結果 ══"
[ "$PASS_A" = 1 ] && ok "Node 沒問題。" || no "Node 有問題，先解決這個——所有 lab 都要它。"
if [ "$PASS_B" = 1 ]; then
  ok "pi 通了。Lab 0 完成，可以往下做。"
else
  no "pi 還沒通。"
  tip "先往下做，午休駐點處理。真的不行，每個 lab 都有 --backend mock 能離線做完。"
fi
echo
[ "$PASS_A" = 1 ] || exit 1
