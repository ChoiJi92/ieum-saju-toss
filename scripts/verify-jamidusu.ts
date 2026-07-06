// scripts/verify-jamidusu.ts
// 자미두수 엔진 검증 — A) 손검증 픽스처 B) iztro 본명반+대한·유년(D-2) 전수 대조 C) 콘텐츠 무결 D) 대한·유년 손검증+콘텐츠 무결
//  A) 손검증 픽스처 4건 (2026-07-05 iztro + 수기 안성 대조 확정치 + 실측 픽스처 1건)
//  B) iztro 전수 대조: 1950~2030 양력 13일 간격 × 시지 4종 → 음력 변환 후 양쪽 안성 비교
//     (주성·보조성·밝기·사화 4항목 대조)
//  C) 콘텐츠 무결성: 14주성 × (별칭호+캐치+명궁+부처+재백+관록) 텍스트 존재/길이
//  D-2) iztro horoscope 전수 대조: 대한·유년 지지·천간·사화·나이구간 9,068건 대조
import { astro } from 'iztro';
import { solarToLunar } from '@fullstackfamily/manseryeok';
import { erectChart, JIJI_HANJA, JIJI_KR, PALACE_ORDER, type MainStar, type MinorStar } from '../src/lib/jamidusu';
import type { MutagenStar } from '../src/lib/jamidusu-stars';
import { computeDaehan, computeYunyeon, currentLunarYearNow, CHEONGAN_KR } from '../src/lib/jamidusu-horoscope';
import { MUTAGEN_PALACE_NOTES, DAEHAN_PALACE_NOTES, YUNYEON_PALACE_NOTES, HOROSCOPE_LEAD, DAEHAN_BEFORE_FIRST } from '../src/lib/jamidusu-content-horoscope';

let fail = 0;
const bad = (msg: string) => { fail++; console.error('  ❌', msg); };
// 계통 오류(테이블 붕괴 등)로 불일치가 쏟아질 때 7분짜리 B 전수 대조를 끝까지 돌리지 않기 위한 조기 중단 기준
const BAIL_THRESHOLD = 20;

// D-2 고정 기준일: 양력 2026-7-1 (설 경계·연말 모호성 없는 한여름)
const REF_YEAR = currentLunarYearNow(new Date(2026, 6, 1));
if (REF_YEAR !== 2026) bad(`D-2 기준년 ${REF_YEAR} ≠ 2026 (만세력 변환 이상)`);

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
if (fail === 0) console.log('  ✅ 손검증 3/3 일치');

// 실측 픽스처: 타 서비스(대형) 실화면 + iztro 대조 완일치 케이스 (2026-07 명궁 불일치 조사에서 확보)
// 궁마다 같은 모양(mutagens 는 없으면 빈 객체)을 유지해 소비 코드의 캐스트를 없앤다.
type RealPalace = { stars: [MainStar, string][]; minors: string[]; mutagens: Record<string, string> };
const REAL_FIXTURE: {
  input: Parameters<typeof erectChart>[0];
  lifeBranch: number; bureau: string; palaces: Record<number, RealPalace>;
} = {
  input: { lunarYear: 1994, lunarMonth: 8, lunarDay: 25, isLeapMonth: false, hourBranch: 5 },
  lifeBranch: 4, bureau: '木3국',
  palaces: {
    0: { stars: [['자미', '평']], minors: [], mutagens: {} },
    1: { stars: [], minors: ['타라', '천괴'], mutagens: {} },
    2: { stars: [['파군', '득']], minors: ['록존'], mutagens: { 파군: '권' } },
    3: { stars: [], minors: ['우필', '경양'], mutagens: {} },
    4: { stars: [['염정', '리'], ['천부', '묘']], minors: ['지겁'], mutagens: { 염정: '록' } },
    5: { stars: [['태음', '함']], minors: ['문창'], mutagens: {} },
    6: { stars: [['탐랑', '왕']], minors: ['지공', '화성'], mutagens: {} },
    7: { stars: [['천동', '불'], ['거문', '불']], minors: ['천월'], mutagens: {} },
    8: { stars: [['무곡', '득'], ['천상', '묘']], minors: ['천마', '영성'], mutagens: { 무곡: '과' } },
    9: { stars: [['태양', '함'], ['천량', '득']], minors: ['문곡'], mutagens: { 태양: '기' } },
    10: { stars: [['칠살', '묘']], minors: [], mutagens: {} },
    11: { stars: [['천기', '평']], minors: ['좌보'], mutagens: {} },
  },
};
{
  // 실패는 전부 bad() 로 집계 — B 섹션과 동일한 컨벤션, 요약 라인은 스냅숏 비교로 판정
  const preFail = fail;
  const c = erectChart(REAL_FIXTURE.input);
  if (c.lifeBranch !== REAL_FIXTURE.lifeBranch) bad(`실측 명궁 ${c.lifeBranch} ≠ ${REAL_FIXTURE.lifeBranch}`);
  if (c.bureau.label !== REAL_FIXTURE.bureau) bad(`실측 국수 ${c.bureau.label} ≠ ${REAL_FIXTURE.bureau}`);
  for (const [bStr, exp] of Object.entries(REAL_FIXTURE.palaces)) {
    const b = Number(bStr); const p = c.palaces[b];
    const expStars = exp.stars.map(([s]) => s).sort().join(',');
    if ([...p.stars].sort().join(',') !== expStars) bad(`실측 주성 @${b}: got [${[...p.stars].sort().join(',')}] ≠ [${expStars}]`);
    for (const [s, br] of exp.stars) {
      if (p.brightness[s] !== br) bad(`실측 밝기 ${s}@${b}: ${p.brightness[s]}≠${br}`);
    }
    if ([...p.minorStars].sort().join(',') !== [...exp.minors].sort().join(',')) bad(`실측 보조성 @${b}: got [${[...p.minorStars].sort().join(',')}] ≠ [${[...exp.minors].sort().join(',')}]`);
    for (const [s, mu] of Object.entries(exp.mutagens)) {
      if (p.mutagens[s as MainStar] !== mu) bad(`실측 사화 ${s}@${b}: ${p.mutagens[s as MainStar]}≠${mu}`);
    }
  }
  // 진시(시지 4) 이면 같은 배치에 명궁만 巳(5) — 유파 경계 회귀 케이스
  const c2 = erectChart({ ...REAL_FIXTURE.input, hourBranch: 4 });
  if (c2.lifeBranch !== 5) bad('진시 명궁 회귀');
  console.log(fail === preFail ? '  ✅ 실측 픽스처 일치' : '  ❌ 실측 픽스처 불일치');
}

// ── B) iztro 전수 대조 ──
console.log('B) iztro 전수 대조 (1950~2030, 13일 간격 × 시지 자·인·오·유)');
const BUREAU_KO: Record<string, number> = { 수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6 };
const STARS: MainStar[] = ['자미', '천기', '태양', '무곡', '천동', '염정', '천부', '태음', '탐랑', '거문', '천상', '천량', '칠살', '파군'];
// iztro 보조성 이름 → 우리 이름 변환 (령성만 다름)
const MINOR_NAME_FIX: Record<string, string> = { 령성: '영성' };
// iztro 밝기 문자열 → 우리 밝기 문자열 매핑
const IZ_BRIGHT: Record<string, string> = { '[+3]': '묘', '[+2]': '왕', '[+1]': '득', '[0]': '리', '[-1]': '평', '[-2]': '불', '[-3]': '함' };
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
    // h 0·6 = 남성, h 2·9 = 여성 → 대한 방향 4상한(양남/음남/양녀/음녀) 전부 커버
    // ko-KR 사전: female='여자' — '여성'은 미매핑되어 iztro 대한 방향이 여성 전건 역행으로 오염됨
    const izGender = h === 0 || h === 6 ? '남성' : '여자';
    let iz: ReturnType<typeof astro.byLunar>;
    const tag = `${sy}-${sm}-${sd} h${h} (음 ${lunar.year}-${lunar.isLeapMonth ? '윤' : ''}${lunar.month}-${lunar.day})`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iz = astro.byLunar(`${lunar.year}-${lunar.month}-${lunar.day}`, h, izGender as any, lunar.isLeapMonth, true, 'ko-KR');
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
      // 보조성 대조
      const izMinors = p.minorStars.map((s) => MINOR_NAME_FIX[s.name] ?? s.name).sort().join(',');
      const myMinors = [...mine.palaces[bIdx].minorStars].sort().join(',');
      if (izMinors !== myMinors) bad(`${tag} ${JIJI_KR[bIdx]}궁 보조성 [${myMinors}] ≠ iztro [${izMinors}]`);
      // 주성 밝기·사화 대조
      for (const s of p.majorStars) {
        const kr = s.name as MainStar;
        if (!(STARS as string[]).includes(kr)) continue;
        const izB = IZ_BRIGHT[s.brightness];
        // 미지의 밝기 형식이면 조용히 건너뛰지 않고 실패 처리 (침묵 통과 방지)
        if (!izB) { bad(`${tag} ${JIJI_KR[bIdx]}궁 ${kr} 미지의 iztro 밝기 형식: ${s.brightness}`); continue; }
        if (mine.palaces[bIdx].brightness[kr] !== izB) bad(`${tag} ${JIJI_KR[bIdx]}궁 ${kr} 밝기 ${mine.palaces[bIdx].brightness[kr]} ≠ iztro ${izB}`);
        const myMu = mine.palaces[bIdx].mutagens[kr] ?? '';
        if ((s.mutagen ?? '') !== myMu) bad(`${tag} ${JIJI_KR[bIdx]}궁 ${kr} 사화 [${myMu}] ≠ iztro [${s.mutagen ?? ''}]`);
      }
      // 보조성 사화 대조
      for (const s of p.minorStars) {
        const kr = (MINOR_NAME_FIX[s.name] ?? s.name) as MinorStar;
        const myMu = mine.palaces[bIdx].mutagens[kr] ?? '';
        if ((s.mutagen ?? '') !== myMu) bad(`${tag} ${JIJI_KR[bIdx]}궁 보조 ${kr} 사화 [${myMu}] ≠ iztro [${s.mutagen ?? ''}]`);
      }
    }
    // ── D-2: 대한·유년 전수 대조 (고정 기준일 2026-7-1) ──
    if (lunar.year <= REF_YEAR) { // 기준일 이후 출생(2027~2030 코퍼스 꼬리)은 대상 밖
      const gd = izGender === '남성' ? 'male' : 'female';
      const hz = iz.horoscope('2026-7-1');
      const myAge = REF_YEAR - lunar.year + 1;
      if (hz.age.nominalAge !== myAge) bad(`${tag} 허세 ${myAge} ≠ iztro ${hz.age.nominalAge}`);
      const dh = computeDaehan(mine, gd, REF_YEAR);
      if (dh === null) {
        // 첫 대한 전 (2021~2026년생 등) — 우리 판정이 맞는지 역확인: iztro 대한 시작나이 > 허세
        if (izLife.decadal.range[0] <= myAge) bad(`${tag} 첫대한전 판정 오류 (iztro 시작 ${izLife.decadal.range[0]} ≤ ${myAge})`);
      } else {
        if (hz.decadal.earthlyBranch !== JIJI_KR[dh.palaceBranch]) bad(`${tag} 대한궁 ${JIJI_KR[dh.palaceBranch]} ≠ iztro ${hz.decadal.earthlyBranch}`);
        if (hz.decadal.heavenlyStem !== CHEONGAN_KR[dh.stemIndex]) bad(`${tag} 대한천간 ${CHEONGAN_KR[dh.stemIndex]} ≠ iztro ${hz.decadal.heavenlyStem}`);
        const myDhStars = dh.hits.map((x) => x.star).join(',');
        if (hz.decadal.mutagen.join(',') !== myDhStars) bad(`${tag} 대한사화 [${myDhStars}] ≠ iztro [${hz.decadal.mutagen.join(',')}]`);
        const izDhPal = iz.palaces.find((p) => p.earthlyBranch === JIJI_KR[dh.palaceBranch]);
        if (!izDhPal) {
          bad(`${tag} 대한궁 지지 ${JIJI_KR[dh.palaceBranch]} iztro 미발견`);
        } else if (izDhPal.decadal.range[0] !== dh.ageStart || izDhPal.decadal.range[1] !== dh.ageEnd) {
          bad(`${tag} 대한구간 ${dh.ageStart}-${dh.ageEnd} ≠ iztro ${izDhPal.decadal.range.join('-')}`);
        }
      }
      const yy = computeYunyeon(mine, REF_YEAR);
      if (hz.yearly.earthlyBranch !== JIJI_KR[yy.taesaeBranch]) bad(`${tag} 태세 ${JIJI_KR[yy.taesaeBranch]} ≠ iztro ${hz.yearly.earthlyBranch}`);
      const myYyStars = yy.hits.map((x) => x.star).join(',');
      if (hz.yearly.mutagen.join(',') !== myYyStars) bad(`${tag} 유년사화 [${myYyStars}] ≠ iztro [${hz.yearly.mutagen.join(',')}]`);
    }
    if (fail > BAIL_THRESHOLD) { console.error(`불일치 ${BAIL_THRESHOLD}건 초과 — 중단`); process.exit(1); }
  }
}
console.log(`  대조 ${total}건 (변환불가 skip ${skipped}건) — ${fail === 0 ? '✅ 전부 일치' : `❌ 불일치 ${fail}건`}`);

// ── C) 콘텐츠 무결성 (콘텐츠 태스크 이후 활성 — 파일 없으면 스킵) ──
try {
  const content = await import('../src/lib/jamidusu-content');
  console.log('C) 콘텐츠 무결성');
  const preFail14 = fail;
  for (const s of STARS) {
    const e = content.STAR_CONTENT[s];
    if (!e) { bad(`${s} 콘텐츠 없음`); continue; }
    if (!e.alias || e.alias.length < 2) bad(`${s} 별칭호 누락`);
    if (!e.catchline || e.catchline.length < 5) bad(`${s} 캐치라인 누락`);
    for (const k of ['life', 'spouse', 'wealth', 'career'] as const) {
      if (!e[k] || e[k].length < 60) bad(`${s}.${k} 풀이 너무 짧음 (${e[k]?.length ?? 0}자)`);
    }
  }
  console.log(fail === preFail14 ? '  ✅ 14주성 통과' : `  ❌ 14주성 ${fail - preFail14}건`);

  // C 확장: 8궁 풀이·밝기 노트·보조성·사화 193유닛
  // Phase 3 완료 후에는 필수 — 로드 실패를 스킵이 아니라 bad()로 처리 (침묵 통과 방지)
  try {
    const { PALACE_READINGS, BRIGHTNESS_NOTES, MUTAGEN_NOTES, MINOR_STAR_NOTES } = await import('../src/lib/jamidusu-content-palace');
    const { MINOR_STARS: MINOR_STARS_LIST, MUTAGEN_TABLE } = await import('../src/lib/jamidusu-stars');

    const FORBIDDEN = ['일주', '월주', '년주', '시주', '십성', '비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인', 'TODO', '…'];
    const STEMS_KR = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const checkText = (label: string, t: string | undefined) => {
      if (!t || t.trim().length < 10) { bad(`C 누락/빈약: ${label}`); return; }
      for (const w of FORBIDDEN) if (t.includes(w)) bad(`C 금지어 "${w}": ${label}`);
    };

    const preFail = fail;
    for (const s of STARS) {
      const r = PALACE_READINGS[s];
      if (!r) { bad(`C PALACE_READINGS 없음: ${s}`); continue; }
      for (const pal of PALACE_ORDER) checkText(`${s}×${pal}`, r[pal]);
      // 4궁 재사용은 원문 텍스트와 일치해야 함 — 복붙 이본 방지
      if (r.명궁 !== content.STAR_CONTENT[s].life || r.부처궁 !== content.STAR_CONTENT[s].spouse || r.재백궁 !== content.STAR_CONTENT[s].wealth || r.관록궁 !== content.STAR_CONTENT[s].career) {
        bad(`C 4궁 매핑 불일치: ${s}`);
      }
      checkText(`${s} bright`, BRIGHTNESS_NOTES[s]?.bright);
      checkText(`${s} dark`, BRIGHTNESS_NOTES[s]?.dark);
    }
    for (const m of MINOR_STARS_LIST) checkText(`보조성 ${m}`, MINOR_STAR_NOTES[m]);
    // 사화 테이블에 등장하는 (별,화) 조합 전수 커버
    for (const [stem, [rok, gwon, gwa, gi]] of Object.entries(MUTAGEN_TABLE)) {
      const pairs: Array<[string, '록' | '권' | '과' | '기']> = [[rok, '록'], [gwon, '권'], [gwa, '과'], [gi, '기']];
      for (const [star, mu] of pairs) checkText(`사화 ${star}×${mu} (${STEMS_KR[Number(stem)] ?? stem}년간)`, MUTAGEN_NOTES[star as MutagenStar]?.[mu]);
    }
    console.log(fail === preFail ? '  ✅ C 확장: 193유닛 무결' : `  ❌ C 확장 ${fail - preFail}건`);
  } catch (e) { bad(`C 확장 로드 실패: ${e}`); }
} catch { console.log('C) 콘텐츠 스킵 (jamidusu-content.ts 미작성)'); }

// ── D) 대한·유년 오버레이 검증 ──
console.log('D) 대한·유년 오버레이');
{
  const preFail = fail;

  // D-1 손검증: 1984-3-15(음) 인시생 — 양간(甲子년). 남=순행 사(5), 여=역행 해(11)
  // 1985-3-15(음) — 음간(乙丑년). 음남=역행 해(11), 음녀=순행 사(5) ← 버그 사분면
  // 근거: zh-CN/en-US 교차 실측 4상한 + D-2 iztro horoscope 9,068건 전수 대조 확정
  const c84 = erectChart({ lunarYear: 1984, lunarMonth: 3, lunarDay: 15, isLeapMonth: false, hourBranch: 2 });
  // 2026년 허세: 2026-1984+1 = 43세
  const dhM = computeDaehan(c84, 'male', 2026);
  const dhF = computeDaehan(c84, 'female', 2026);
  if (!dhM || !dhF) bad('D-1 1984 대한 null');
  else {
    if (dhM.ageStart > 43 || dhM.ageEnd < 43) bad(`D-1 남 나이구간 ${dhM.ageStart}-${dhM.ageEnd}에 43 미포함`);
    if (dhM.palaceBranch !== 5) bad(`D-1 남 대한궁 ${dhM.palaceBranch}`);   // 사(5): (2+3)%12=5
    if (dhF.palaceBranch !== 11) bad(`D-1 여 대한궁 ${dhF.palaceBranch}`);  // 해(11): (2-3+12)%12=11
  }
  // D-1 음남(乙丑 1985) — 양남과 반대 방향(역행) 확인. 2026년 허세 42세
  const c85 = erectChart({ lunarYear: 1985, lunarMonth: 3, lunarDay: 15, isLeapMonth: false, hourBranch: 2 });
  const dhM85 = computeDaehan(c85, 'male', 2026);
  if (!dhM85) bad('D-1 1985 음남 대한 null');
  else {
    if (dhM85.ageStart > 42 || dhM85.ageEnd < 42) bad(`D-1 음남 나이구간 ${dhM85.ageStart}-${dhM85.ageEnd}에 42 미포함`);
    if (dhM85.palaceBranch !== 11) bad(`D-1 음남 대한궁 ${dhM85.palaceBranch}`); // 해(11): (2-3+12)%12=11
  }
  // D-1 음녀(乙丑 1985) — 버그가 살았던 사분면. 음녀=순행이므로 대한궁=사(5).
  // 근거: zh-CN/en-US 교차 실측 1985 음녀 42세 → 巳[35,44] range 포함, (명궁 인=2, index 3 순행 → (2+3)%12=5)
  const dhF85 = computeDaehan(c85, 'female', 2026);
  if (!dhF85) bad('D-1 1985 음녀 대한 null');
  else {
    if (dhF85.ageStart > 42 || dhF85.ageEnd < 42) bad(`D-1 음녀 나이구간 ${dhF85.ageStart}-${dhF85.ageEnd}에 42 미포함`);
    if (dhF85.palaceBranch !== 5) bad(`D-1 음녀 대한궁 ${dhF85.palaceBranch} ≠ 5(사) — 음녀=순행`);
  }
  // D-1 유년: 2026 = 병오년 → 태세궁 지지 6(午), 천간 2(丙) → 사화 [천동,천기,문창,염정]
  const yy = computeYunyeon(c84, 2026);
  if (yy.taesaeBranch !== 6) bad(`D-1 태세 ${yy.taesaeBranch}≠6`);
  if (yy.yearLabel !== '병오년') bad(`D-1 라벨 ${yy.yearLabel}`);
  if (yy.hits.map((h) => h.star).join(',') !== '천동,천기,문창,염정') bad(`D-1 유년사화 ${yy.hits.map((h) => h.star).join(',')}`);
  // D-1 첫 대한 전: 2024년생(2026년 허세 3세) — 픽스처 국수를 명시 잠금 (실측 6국)
  // 근거: erectChart({ lunarYear:2024, lunarMonth:3, lunarDay:15, isLeapMonth:false, hourBranch:2 }).bureau.number === 6
  const cKid = erectChart({ lunarYear: 2024, lunarMonth: 3, lunarDay: 15, isLeapMonth: false, hourBranch: 2 });
  if (cKid.bureau.number !== 6) bad(`D-1 kid 픽스처 국수 ${cKid.bureau.number} ≠ 6 (픽스처 변질)`);
  if (computeDaehan(cKid, 'male', 2026) !== null) bad('D-1 첫 대한 전인데 null 아님');
  // D-1 설 경계: 2026년 설(양력 2/17) 전날은 을사년(2025), 당일은 병오년(2026)
  // 근거: manseryeok solarToLunar 실측 — 2026-02-16 → 음력 2025-12-29, 2026-02-17 → 음력 2026-01-01
  if (currentLunarYearNow(new Date(2026, 1, 16)) !== 2025) bad('D-1 설 전날 경계');
  if (currentLunarYearNow(new Date(2026, 1, 17)) !== 2026) bad('D-1 설 당일 경계');

  console.log(fail === preFail ? '  ✅ D-1 손검증 일치' : '  ❌ D-1 손검증 불일치');
}

// D-3: 오버레이 콘텐츠 무결 (74유닛 = 48 + 12 + 12 + 고정 문구 2)
{
  const preFail = fail;
  // C 게이트 실제 목록 + 자미두수엔 없는 사주 용어('십신','대운','TBD') 추가
  const FORBIDDEN = ['일주', '월주', '년주', '시주', '십성', '십신', '대운', '비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인', 'TODO', 'TBD', '…'];
  const units: [string, string][] = [];
  for (const [mu, row] of Object.entries(MUTAGEN_PALACE_NOTES)) for (const [pal, txt] of Object.entries(row)) units.push([`사화${mu}×${pal}`, txt as string]);
  for (const [pal, txt] of Object.entries(DAEHAN_PALACE_NOTES)) units.push([`대한×${pal}`, txt]);
  for (const [pal, txt] of Object.entries(YUNYEON_PALACE_NOTES)) units.push([`유년×${pal}`, txt]);
  units.push(['리드', HOROSCOPE_LEAD], ['첫대한전', DAEHAN_BEFORE_FIRST]);
  if (units.length !== 74) bad(`D-3 유닛 수 ${units.length} ≠ 74`);
  for (const [k, txt] of units) {
    if (!txt || txt.trim().length < 10) bad(`D-3 ${k} 길이 미달`);
    for (const w of FORBIDDEN) if (txt.includes(w)) bad(`D-3 ${k} 금지어 "${w}"`);
  }
  // 시제 중립: MUTAGEN_PALACE_NOTES 에 "올해"/"10년" 금지 (대한·유년 공용이므로)
  for (const [mu, row] of Object.entries(MUTAGEN_PALACE_NOTES)) for (const [pal, txt] of Object.entries(row))
    if ((txt as string).includes('올해') || (txt as string).includes('10년')) bad(`D-3 사화${mu}×${pal} 시제 중립 위반`);
  console.log(fail === preFail ? '  ✅ D-3 콘텐츠 무결 (74유닛)' : '  ❌ D-3 콘텐츠 무결 실패');
}

if (fail > 0) { console.error(`\n❌ 검증 실패 ${fail}건 — 엔진/콘텐츠를 고치세요. 기대값 수정 금지.`); process.exit(1); }
console.log('\n✅ 자미두수 검증 전체 통과');
