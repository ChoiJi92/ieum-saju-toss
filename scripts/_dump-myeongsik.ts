/**
 * 유료 리포트 프롬프트에 넣을 명식 재료를 한 번에 덤프.
 *
 *   npx tsx scripts/_dump-myeongsik.ts 1992-05-13:7:M
 *   npx tsx scripts/_dump-myeongsik.ts 1995-08-15:14:F:L    # 음력
 *
 * 형식: YYYY-MM-DD[:시][:M|F][:L]
 */
import { computeMyeongsik, TG_KR, DZ_KR, OHAENG_KR, type SajuInput } from '../src/lib/saju';
import { getSipsung } from '../src/lib/sipsung';
import { getDaewoon, getSeun } from '../src/lib/daewoon';
import { getSinsal } from '../src/lib/sinsal';
import { spiritFromMyeongsik } from '../src/lib/spirit';

const token = process.argv[2];
if (!token) {
  console.log('사용법: npx tsx scripts/_dump-myeongsik.ts YYYY-MM-DD[:시][:M|F][:L]');
  process.exit(1);
}

const parts = token.split(':');
const [y, m, d] = parts[0].split('-').map(Number);
const hourTok = parts.slice(1).find((p) => /^\d+(\.\d+)?$/.test(p));
const [hh, mm] = (hourTok ?? '').split('.');
const gender: 'male' | 'female' = parts.some((p) => p.toUpperCase() === 'F') ? 'female' : 'male';

const input: SajuInput = {
  year: y, month: m, day: d,
  calendar: parts.some((p) => p.toUpperCase() === 'L') ? 'lunar' : 'solar',
  hour: hourTok !== undefined ? Number(hh) : undefined,
  minute: mm !== undefined ? Number(mm) : 0,
  gender,
  name: '샘플',
};

const ms = computeMyeongsik(input);
const sp = spiritFromMyeongsik(ms);
const daewoon = getDaewoon(ms, { year: y, gender });
const seun = getSeun(ms, { year: y });
const sinsal = getSinsal(ms);

const kr = (c: string) => TG_KR[c] ?? DZ_KR[c] ?? c;

console.log(JSON.stringify({
  입력: { 생년월일: `${y}-${m}-${d}`, 시: hourTok ?? '모름', 성별: gender === 'male' ? '남' : '여' },
  명식: ms.pillars.map((p) => ({
    기둥: p.label,
    간지: `${p.top.c}${p.bot.c}`,
    한글: `${kr(p.top.c)}${kr(p.bot.c)}`,
    천간십성: p.isSelf ? '일간(나)' : getSipsung(ms.ilgan.c as never, p.top.c as never),
    오행: `${OHAENG_KR[p.top.ohaeng]}/${OHAENG_KR[p.bot.ohaeng]}`,
  })),
  일간: `${ms.ilgan.c}(${kr(ms.ilgan.c)}) · ${OHAENG_KR[ms.ilgan.ohaeng]}`,
  오행분포: Object.fromEntries(Object.entries(ms.ohaeng).map(([k, v]) => [OHAENG_KR[k as never], v])),
  신강신약: {
    판정: ms.shinkang.label,
    점수: (ms.shinkang as Record<string, unknown>).score,
    용신: `${OHAENG_KR[ms.shinkang.yongshin.ohaeng]}`,
    사유: ms.shinkang.yongshinReason,
  },
  시모름: ms.unknownTime,
  정령: { 이름: sp.name, 등급: sp.rarity.ko },
  대운: daewoon.map((x) => ({ ...x })),
  세운: seun.map((x) => ({ ...x })),
  신살: sinsal.map((s) => ({ 이름: s.name, ...s })),
}, null, 2));
