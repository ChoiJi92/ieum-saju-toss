// src/lib/jamidusu-horoscope.ts — 대한(10년 운)·유년(올해 운) 오버레이 계산 (Phase 4)
// 순수 함수 — JamiChart 를 절대 변형하지 않는다. gender 는 함수 인자로만 받는다.
import type { JamiChart, JamiPalace, PalaceName } from './jamidusu';
import { JIJI_KR } from './jamidusu';
import { MUTAGEN_TABLE, MUTAGEN_KEYS, type Mutagen, type MutagenStar } from './jamidusu-stars';
import { solarToLunar } from '@fullstackfamily/manseryeok';

/** 천간 독음 (0=갑 … 9=계) */
export const CHEONGAN_KR = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;

/** 사화 1개가 붙는 별 + 그 별이 앉은 본명궁 */
export type MutagenHit = {
  mutagen: Mutagen;
  star: MutagenStar;
  palaceBranch: number;
  palaceName: PalaceName;
};

export type DaehanInfo = {
  index: number;        // 0 = 첫 대한
  palaceBranch: number; // 대한이 지나는 본명궁 지지
  palaceName: PalaceName;
  ageStart: number;     // 허세
  ageEnd: number;
  stemIndex: number;    // 대한궁 천간 (오호둔 — 궁에 이미 저장됨)
  hits: [MutagenHit, MutagenHit, MutagenHit, MutagenHit];
};

export type YunyeonInfo = {
  lunarYear: number;
  yearLabel: string;    // 예: '병오년'
  taesaeBranch: number; // 올해 지지 = 태세궁
  palaceName: PalaceName;
  stemIndex: number;    // 올해 천간
  hits: [MutagenHit, MutagenHit, MutagenHit, MutagenHit];
};

/** 별이 앉은 본명궁 — 주성 → 보조성 순 탐색.
 *  14주성·문창·문곡·좌보·우필은 항상 전부 배치되므로 miss 는 구조적으로 불가능(발견 실패 = 데이터 버그 → throw). */
export function findStarPalace(chart: JamiChart, star: MutagenStar): JamiPalace {
  for (const p of chart.palaces) {
    if ((p.stars as readonly string[]).includes(star)) return p;
    if ((p.minorStars as readonly string[]).includes(star)) return p;
  }
  throw new Error(`사화 별 위치 없음: ${star}`);
}

/** 천간 인덱스 → 사화 4개(록·권·과·기)의 별 + 위치 */
export function mutagenHits(chart: JamiChart, stemIndex: number): [MutagenHit, MutagenHit, MutagenHit, MutagenHit] {
  const stars = MUTAGEN_TABLE[stemIndex];
  if (!stars) throw new Error(`천간 범위 밖: ${stemIndex}`);
  return MUTAGEN_KEYS.map((mutagen, i) => {
    const p = findStarPalace(chart, stars[i]);
    return { mutagen, star: stars[i], palaceBranch: p.branch, palaceName: p.name };
  }) as [MutagenHit, MutagenHit, MutagenHit, MutagenHit];
}

/** 현재 대한. 허세 나이가 오행국 수(첫 대한 시작 나이) 미만이면 null.
 *
 *  ── 방향 규칙 ──
 *  고전 규칙(紫微斗數): 양남음녀 순행 / 음남양녀 역행.
 *  iztro 소스 palace.js getHoroscope 주석과 완전 일치:
 *    "大限由命宫起，阳男阴女顺行；阴男阳女逆行"
 *
 *  ── ko-KR 로케일 버그 발견 내역 ──
 *  iztro ko-KR 사전(node_modules/iztro/lib/i18n/locales/ko-KR/gender.js)은
 *    male: '남성', female: '여자'
 *  로 정의된다. 이전 버전 스크립트는 여성에 '여성'을 넘겨 왔고, 이 값은 사전 미매핑 →
 *  iztro 내부 GENDER[genderKey] === undefined → 대한 방향 판정이 항상 false →
 *  **여성 전건 역행**으로 오염되는 버그 경로였다.
 *  검증 스크립트(verify-jamidusu.ts)는 '여자'를 사용하여 iztro 와 올바르게 비교한다.
 *
 *  ── 4상한 실측 근거 ──
 *  zh-CN / en-US 로케일 교차 실측 + D-2 iztro horoscope 9,068건 전수 대조로 고정:
 *    1984 甲子(양간) 남성: 명궁=인(2) 순행, 43세 대한궁=사(5)  = (2+3)%12 ✓
 *    1984 甲子(양간) 여성: 명궁=인(2) 역행, 43세 대한궁=해(11) = (2-3+12)%12 ✓
 *    1985 乙丑(음간) 남성: 명궁=인(2) 역행, 42세 대한궁=해(11) = (2-3+12)%12 ✓
 *    1985 乙丑(음간) 여성: 명궁=인(2) 순행, 42세 대한궁=사(5)  = (2+3)%12 ✓
 */
export function computeDaehan(chart: JamiChart, gender: 'male' | 'female', currentLunarYear: number): DaehanInfo | null {
  const age = currentLunarYear - chart.input.lunarYear + 1; // 허세
  const start = chart.bureau.number;
  if (age < start) return null;
  const index = Math.floor((age - start) / 10);
  const yangYear = chart.yearStemIndex % 2 === 0; // 짝수 인덱스 = 양간
  // 양남음녀 순행 / 음남양녀 역행 (고전 규칙 + iztro palace.js 일치)
  const forward = (yangYear && gender === 'male') || (!yangYear && gender === 'female');
  const palaceBranch = (((chart.lifeBranch + (forward ? index : -index)) % 12) + 12) % 12;
  const palace = chart.palaces[palaceBranch];
  return {
    index,
    palaceBranch,
    palaceName: palace.name,
    ageStart: start + 10 * index,
    ageEnd: start + 10 * index + 9,
    stemIndex: palace.stemIndex,
    hits: mutagenHits(chart, palace.stemIndex),
  };
}

/** 올해 운 — 태세궁(올해 지지의 본명궁) + 올해 천간 사화 */
export function computeYunyeon(chart: JamiChart, currentLunarYear: number): YunyeonInfo {
  // 근거: 서기 4년 = 갑자년 (갑=0, 자=0) — (year-4)%10 이 천간, %12 가 지지
  const stemIndex = (((currentLunarYear - 4) % 10) + 10) % 10;
  const taesaeBranch = (((currentLunarYear - 4) % 12) + 12) % 12;
  return {
    lunarYear: currentLunarYear,
    yearLabel: `${CHEONGAN_KR[stemIndex]}${JIJI_KR[taesaeBranch]}년`,
    taesaeBranch,
    palaceName: chart.palaces[taesaeBranch].name,
    stemIndex,
    hits: mutagenHits(chart, stemIndex),
  };
}

/** 렌더 시점의 '현재 음력년' — 설날(음력 새해) 경계. 변환 실패 시 throw (호출부가 섹션 숨김으로 처리). */
export function currentLunarYearNow(now: Date = new Date()): number {
  return solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate()).lunar.year;
}
