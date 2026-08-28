#!/usr/bin/env bash
# 유료 리포트 서버 스모크 테스트.
#
#   bash scripts/_test-report.sh 1992-05-13:7:M 최지훈 [orderId]
#
# grant → generate 를 순서대로 때리고, 스트리밍 본문을 파일로 받아 소요 시간과 글자 수를 찍는다.
set -euo pipefail

BIRTH="${1:?생년월일 필요 (예: 1992-05-13:7:M)}"
NAME="${2:-고객}"
ORDER_ID="${3:-test-$(date +%s)}"

# 공개 저장소라 키를 파일에 적지 않는다.
# 프로젝트 루트에 .env.supabase (gitignore 대상) 를 만들고 아래 두 줄을 넣어둘 것.
#   SUPABASE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1/report
#   SUPABASE_ANON_KEY=<anon key>
[ -f .env.supabase ] && . ./.env.supabase

URL="${SUPABASE_FUNCTIONS_URL:?SUPABASE_FUNCTIONS_URL 이 필요해요 (.env.supabase 참고)}"
ANON="${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY 가 필요해요 (.env.supabase 참고)}"
OUT="/tmp/report-${ORDER_ID}.md"

echo "▸ 명식 계산: $BIRTH"
npx tsx scripts/_dump-myeongsik.ts "$BIRTH" > /tmp/ms.json

python3 - "$ORDER_ID" "$NAME" <<'PY' > /tmp/grant.json
import json, sys
order_id, name = sys.argv[1], sys.argv[2]
ms = json.load(open('/tmp/ms.json'))
json.dump({'orderId': order_id, 'sku': 'report_basic', 'name': name, 'myeongsik': ms},
          open('/tmp/grant.json', 'w'), ensure_ascii=False)
PY

echo "▸ grant ($ORDER_ID)"
curl -sS -X POST "$URL/grant" \
  -H "Authorization: Bearer $ANON" -H 'content-type: application/json' \
  --data-binary @/tmp/grant.json
echo

: > "$OUT"
for CH in 1 2; do
  echo "▸ generate 장$CH — 스트리밍"
  S=$(python3 -c 'import time; print(time.time())')
  curl -sS -N -X POST "$URL/generate" \
    -H "Authorization: Bearer $ANON" -H 'content-type: application/json' \
    -d "{\"orderId\":\"$ORDER_ID\",\"chapter\":$CH}" | tee -a "$OUT" > /tmp/ch$CH.md
  E=$(python3 -c 'import time; print(time.time())')
  printf '\n\n' >> "$OUT"
  python3 -c "print(f'   → {$E - $S:.1f}초 / {len(open('/tmp/ch$CH.md', encoding='utf-8').read()):,}자')"
done

echo "────────────────────────────────────"
python3 - "$OUT" <<'PY'
import sys
text = open(sys.argv[1], encoding='utf-8').read()
print(f'전체 글자 수  {len(text):,}자')
print(f'저장 위치     {sys.argv[1]}')
PY
