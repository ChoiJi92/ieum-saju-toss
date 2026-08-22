/**
 * 스레드 리플 생성기 (정령편) — 생년월일 → 정령 이름·등급 + 복붙용 리플.
 *
 *   npx tsx scripts/spirit-reply.ts 1992-05-13
 *   npx tsx scripts/spirit-reply.ts 1992-05-13:7          # 시(時) 포함
 *   npx tsx scripts/spirit-reply.ts 1995-08-15:L          # 음력
 *   npx tsx scripts/spirit-reply.ts 1992-05-13 1988-11-03:14 1995-08-15:L   # 여러 명 한 번에
 *
 * 형식: YYYY-MM-DD[:시][:L]  (L = 음력)
 *
 * 톤 가이드: 해요체, AI 냄새 금지, 짧게.
 *   - 일반 등급은 등급을 언급하지 않는다 (위축되지 않게 캐릭터 매력만)
 *   - 희귀 이상만 등급·확률을 밝힌다 (자랑거리가 되게)
 */
import { computeMyeongsik } from '../src/lib/saju';
import { spiritFromMyeongsik } from '../src/lib/spirit';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('사용법: npx tsx scripts/spirit-reply.ts YYYY-MM-DD[:시][:L] ...');
  process.exit(1);
}

/** 마지막 글자에 받침이 있는지 (한글만 판정, 아니면 false) */
function hasBatchim(word: string): boolean {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}

/** 조사 선택 — 받침 있으면 first, 없으면 second (예: josa(name, '이', '가')) */
function josa(word: string, withBatchim: string, without: string): string {
  return hasBatchim(word) ? withBatchim : without;
}

/** 등급별 리플 꼬리말 — 일반은 등급 언급 없음 */
const TAIL: Record<string, string> = {
  일반: '',
  희귀: '\n\n희귀 등급이에요 ⭐⭐ 넷 중 하나꼴로 나오는 결이고요.',
  영물: '\n\n영물 등급이에요 ⭐⭐⭐ 열 명 중 한 명꼴이라 꽤 귀해요.',
  전설: '\n\n전설 등급이에요 ⭐⭐⭐⭐ 백 명 중 일곱 명! 오늘 처음 나왔을지도 몰라요.',
};

for (const raw of args) {
  const parts = raw.split(':');
  const dateStr = parts[0];
  const lunar = parts.some((p) => p.toUpperCase() === 'L');
  const hourPart = parts.slice(1).find((p) => /^\d{1,2}$/.test(p));
  const hour = hourPart !== undefined ? Number(hourPart) : undefined;

  const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) {
    console.log(`❌ 형식 오류: ${raw}`);
    continue;
  }
  const [, y, mo, d] = m;

  try {
    const myeongsik = computeMyeongsik({
      year: Number(y), month: Number(mo), day: Number(d),
      calendar: lunar ? 'lunar' : 'solar',
      hour, minute: 0, gender: 'male', name: '님',
    });
    const s = spiritFromMyeongsik(myeongsik);
    const stars = '★'.repeat(s.rarity.stars) + '☆'.repeat(4 - s.rarity.stars);

    console.log(`\n━━━ ${raw} ━━━`);
    console.log(`${s.name} · ${stars} ${s.rarity.ko} (${s.rarity.pct}) · ${s.formula}`);
    console.log('─── 리플 (복붙용) ───');
    const subject = `${s.name}${josa(s.name, '이', '가')}`;
    // persona 앞부분(vibe)은 라이브러리 문자열이라 조사가 어긋날 수 있어 뒷문장만 사용
    const vibeLine = `${s.elem.vibe}${josa(s.elem.vibe, '을', '를')} 품은 ${s.zod.trait} 기질이에요.`;
    const closing = `${s.line}처럼 ${s.elem.trait} 마음으로 세상을 대하는 결이고요.`;
    console.log(`${subject} 나왔어요! ${s.title}이에요.
${vibeLine} ${closing}${TAIL[s.rarity.ko] ?? ''}`);
  } catch (e) {
    console.log(`❌ ${raw} — 계산 실패: ${String(e).slice(0, 80)}`);
  }
}
