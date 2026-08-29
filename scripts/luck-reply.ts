/**
 * 스레드 리플 생성기 (럭키맥싱편) — 생년월일 → 부족한 기운 + 행운 색·방향 + 복붙용 리플.
 *
 *   npx tsx scripts/luck-reply.ts 1992-05-13
 *   npx tsx scripts/luck-reply.ts 1992-05-13:7          # 시(時) 포함
 *   npx tsx scripts/luck-reply.ts 1995-08-15:L          # 음력
 *   npx tsx scripts/luck-reply.ts 1992-05-13 1988-11-03:14   # 여러 명 한 번에
 *
 * 형식: YYYY-MM-DD[:시][:L]  (L = 음력)
 *
 * 톤 가이드: 해요체, AI 냄새 금지, 짧게.
 *   - "부족한 기운"은 용신(신강신약 기반) 기준
 *   - 색·방향은 luck-guide 테이블 그대로 (앱 화면과 동일해야 함)
 *   - 정령 이름은 덤으로 한 줄 (등급은 희귀 이상만 언급)
 */
import { computeMyeongsik, OHAENG_KR, type SajuInput } from '../src/lib/saju';
import { spiritFromMyeongsik } from '../src/lib/spirit';
import { COLOR_BY_OHAENG, DIR_BY_OHAENG, LUCK_ACTIVITY } from '../src/lib/luck-guide';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('사용법: npx tsx scripts/luck-reply.ts YYYY-MM-DD[:시][:L] ...');
  process.exit(1);
}

/** 마지막 글자에 받침이 있는지 (한글만 판정) */
function hasBatchim(word: string): boolean {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}

/** "YYYY-MM-DD[:시][:L]" 파싱 */
function parse(token: string): SajuInput {
  const parts = token.split(':');
  const [y, m, d] = parts[0].split('-').map(Number);
  const lunar = parts.some((p) => p.toUpperCase() === 'L');
  const hourTok = parts.slice(1).find((p) => /^\d+$/.test(p));
  return {
    year: y, month: m, day: d,
    calendar: lunar ? 'lunar' : 'solar',
    hour: hourTok !== undefined ? Number(hourTok) : undefined,
    gender: 'female',
    name: token,
  };
}

for (const token of args) {
  const input = parse(token);
  const ms = computeMyeongsik(input);
  const sp = spiritFromMyeongsik(ms);

  const need = ms.shinkang.yongshin.ohaeng;        // 부족한(=보완이 되는) 기운
  const needKr = OHAENG_KR[need];                   // 목/화/토/금/수
  const color = COLOR_BY_OHAENG[need];
  const dir = DIR_BY_OHAENG[need];
  const act = LUCK_ACTIVITY[need];
  const rarity = sp.rarity.ko;

  const 은는 = hasBatchim(needKr) ? '은' : '는';
  const 이가 = hasBatchim(sp.name) ? '이' : '가';

  console.log('─'.repeat(58));
  console.log(`■ ${token}`);
  console.log(`   일주      ${ms.ilgan.c}${ms.pillars[2].bot.c}  (${sp.name} · ${rarity})`);
  console.log(`   신강신약  ${ms.shinkang.label}`);
  console.log(`   부족한 기운  ${needKr}(${need})`);
  console.log(`   색·방향   ${color} / ${dir}`);
  console.log(`   사유      ${ms.shinkang.yongshinReason}`);
  console.log('');
  console.log('   ┌─ 복붙용 ─────────────────────────────────');
  console.log(`   │ ${needKr} 기운이 필요하신 사주예요`);
  console.log('   │');
  console.log(`   │ 색은 ${color}, 방향은 ${dir}이 도움이 돼요`);
  console.log(`   │ ${act[0].toUpperCase()}${act.slice(1)} 쪽도 잘 맞고요`);
  console.log('   │');
  console.log(`   │ 참고로 정령은 ${sp.name}${이가} 나왔어요 ${sp.zod.emoji}`);
  console.log('   └──────────────────────────────────────────');
  console.log('');
}
