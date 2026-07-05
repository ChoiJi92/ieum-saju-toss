// scripts/verify-jamidusu.ts
// 자미두수 엔진 3중 검증 — 커밋 전 필수 실행: npx tsx scripts/verify-jamidusu.ts
//  A) 손검증 픽스처 3건 (2026-07-05 iztro + 수기 안성 대조 확정치)
//  B) iztro 전수 대조: 1950~2030 양력 13일 간격 × 시지 4종 → 음력 변환 후 양쪽 안성 비교
//  C) 콘텐츠 무결성: 14주성 × (별칭호+캐치+명궁+부처+재백+관록) 텍스트 존재/길이
import { astro } from 'iztro';
import { solarToLunar } from '@fullstackfamily/manseryeok';
import { erectChart, JIJI_HANJA, JIJI_KR, type MainStar } from '../src/lib/jamidusu';

let fail = 0;
const bad = (msg: string) => { fail++; console.error('  ❌', msg); };

// ── A) 손검증 픽스처 ──
console.log('A) 손검증 픽스처');
const FIXTURES = [
  { id: 'F1', in: { lunarYear: 2000, lunarMonth: 7, lunarDay: 17, isLeapMonth: false, hourBranch: 2 }, life: '午', num: 3, ziwei: '午', stars: ['자미'] },
  { id: 'F2', in: { lunarYear: 2023, lunarMonth: 2, lunarDay: 20, isLeapMonth: true, hourBranch: 0 }, life: '辰', num: 5, ziwei: '巳', stars: ['천기', '천량'] },
  { id: 'F3', in: { lunarYear: 1989, lunarMonth: 12, lunarDay: 24, isLeapMonth: false, hourBranch: 6 }, life: '未', num: 5, ziwei: '巳', stars: [] },
] as const;
for (const f of FIXTURES) {
  const c = erectChart({ ...f.in });
  if (JIJI_HANJA[c.lifeBranch] !== f.life) bad(`${f.id} 명궁 ${JIJI_HANJA[c.lifeBranch]} ≠ ${f.life}`);
  if (c.bureau.number !== f.num) bad(`${f.id} 국수 ${c.bureau.number} ≠ ${f.num}`);
  if (JIJI_HANJA[c.ziweiBranch] !== f.ziwei) bad(`${f.id} 자미 ${JIJI_HANJA[c.ziweiBranch]} ≠ ${f.ziwei}`);
  const got = c.palaces[c.lifeBranch].stars.join(',');
  if (got !== f.stars.join(',')) bad(`${f.id} 명궁주성 [${got}] ≠ [${f.stars.join(',')}]`);
}
if (fail === 0) console.log('  ✅ 3/3 일치');

// ── B) iztro 전수 대조 ──
console.log('B) iztro 전수 대조 (1950~2030, 13일 간격 × 시지 자·인·오·유)');
const BUREAU_KO: Record<string, number> = { 수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6 };
const STARS: MainStar[] = ['자미', '천기', '태양', '무곡', '천동', '염정', '천부', '태음', '탐랑', '거문', '천상', '천량', '칠살', '파군'];
let total = 0, skipped = 0;
const start = new Date(1950, 0, 1).getTime();
const end = new Date(2030, 11, 31).getTime();
for (let t = start; t <= end; t += 13 * 86400000) {
  const d = new Date(t);
  const [sy, sm, sd] = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
  let lunar: { year: number; month: number; day: number; isLeapMonth: boolean };
  try { lunar = solarToLunar(sy, sm, sd).lunar; } catch { skipped++; continue; }
  for (const h of [0, 2, 6, 9]) {
    total++;
    const mine = erectChart({ lunarYear: lunar.year, lunarMonth: lunar.month, lunarDay: lunar.day, isLeapMonth: lunar.isLeapMonth, hourBranch: h });
    // 같은 음력을 iztro 에 직접 입력 (달력 소스 차이 배제 — 순수 안성 로직만 비교)
    let iz: ReturnType<typeof astro.byLunar>;
    const tag = `${sy}-${sm}-${sd} h${h} (음 ${lunar.year}-${lunar.isLeapMonth ? '윤' : ''}${lunar.month}-${lunar.day})`;
    try {
      iz = astro.byLunar(`${lunar.year}-${lunar.month}-${lunar.day}`, h, '여성', lunar.isLeapMonth, true, 'ko-KR');
    } catch { skipped++; total--; continue; }
    // 달력 소스 차이 배제: manseryeok 이 윤달로 반환했지만 iztro lunar-lite 가 비윤달로 역산하는 경우,
    // 혹은 그 반대인 경우는 달력 데이터 불일치이므로 순수 안성 로직 비교 대상에서 제외한다.
    const izRaw = (iz as unknown as { rawDates: { lunarDate: { isLeap: boolean } } }).rawDates;
    if (izRaw && izRaw.lunarDate.isLeap !== lunar.isLeapMonth) { skipped++; total--; continue; }
    const izLife = iz.palaces.find((p) => p.name === '명궁');
    if (!izLife) { bad(`${tag} iztro 명궁 없음`); continue; }
    if (izLife.earthlyBranch !== JIJI_KR[mine.lifeBranch]) bad(`${tag} 명궁 ${JIJI_KR[mine.lifeBranch]} ≠ iztro ${izLife.earthlyBranch}`);
    const izBody = iz.palaces.find((p) => p.isBodyPalace);
    if (izBody && izBody.earthlyBranch !== JIJI_KR[mine.bodyBranch]) bad(`${tag} 신궁 ${JIJI_KR[mine.bodyBranch]} ≠ iztro ${izBody.earthlyBranch}`);
    const izNum = BUREAU_KO[iz.fiveElementsClass as string];
    if (!izNum) bad(`${tag} 미지의 오행국 라벨: ${iz.fiveElementsClass}`);
    else if (izNum !== mine.bureau.number) bad(`${tag} 국수 ${mine.bureau.number} ≠ iztro ${izNum}`);
    for (const p of iz.palaces) {
      const bIdx = JIJI_KR.indexOf(p.earthlyBranch as (typeof JIJI_KR)[number]);
      if (bIdx < 0) { bad(`${tag} 미지의 지지: ${p.earthlyBranch}`); continue; }
      const izStars = p.majorStars.map((s) => s.name).filter((s) => (STARS as string[]).includes(s)).sort();
      const myStars = [...mine.palaces[bIdx].stars].sort();
      if (izStars.join(',') !== myStars.join(',')) bad(`${tag} ${JIJI_KR[bIdx]}궁 주성 [${myStars.join(',')}] ≠ iztro [${izStars.join(',')}]`);
    }
    if (fail > 20) { console.error('불일치 20건 초과 — 중단'); process.exit(1); }
  }
}
console.log(`  대조 ${total}건 (변환불가 skip ${skipped}건) — ${fail === 0 ? '✅ 전부 일치' : `❌ 불일치 ${fail}건`}`);

// ── C) 콘텐츠 무결성 (콘텐츠 태스크 이후 활성 — 파일 없으면 스킵) ──
try {
  const content = await import('../src/lib/jamidusu-content');
  console.log('C) 콘텐츠 무결성');
  for (const s of STARS) {
    const e = content.STAR_CONTENT[s];
    if (!e) { bad(`${s} 콘텐츠 없음`); continue; }
    if (!e.alias || e.alias.length < 2) bad(`${s} 별칭호 누락`);
    if (!e.catchline || e.catchline.length < 5) bad(`${s} 캐치라인 누락`);
    for (const k of ['life', 'spouse', 'wealth', 'career'] as const) {
      if (!e[k] || e[k].length < 60) bad(`${s}.${k} 풀이 너무 짧음 (${e[k]?.length ?? 0}자)`);
    }
  }
  if (fail === 0) console.log('  ✅ 14주성 통과');
} catch { console.log('C) 콘텐츠 스킵 (jamidusu-content.ts 미작성)'); }

if (fail > 0) { console.error(`\n❌ 검증 실패 ${fail}건 — 엔진/콘텐츠를 고치세요. 기대값 수정 금지.`); process.exit(1); }
console.log('\n✅ 자미두수 검증 전체 통과');
