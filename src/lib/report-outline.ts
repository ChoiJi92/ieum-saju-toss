/**
 * 유료 리포트 목차 — 결제 전에 "이 리포트가 무엇을 하는지"를 보여준다.
 *
 * 앱의 무료 화면들은 주제로는 이미 빈틈이 없다(성격·연애·직업·건강·대운·신살…).
 * 다만 전부 룩업 테이블이라 **조각을 따로따로** 준다.
 *   "기토 일간이다" "편관이 있다" "화개살이 있다" "쇠가 부족하다"
 * 넷 다 맞는 말인데, 그것들이 어떻게 맞물리는지는 어느 화면도 말하지 않는다.
 * 조합의 경우의 수가 수만 가지라 미리 써둘 수 없기 때문이다.
 *
 * 그래서 이 리포트의 정체는 "조각을 잇는 글"이고, 목차도 그 성격이 보이게 만든다.
 * 항목이 전부 "A와 B가 만나는 자리" 꼴인 이유다. 무료 화면에는 없는 문장 형태다.
 *
 * 여기서 만드는 건 어디를 이을지(=제목)까지고, 실제 해석은 본문(AI)이 쓴다.
 * 계산만으로 만들어지므로 원가는 0원이다.
 */
import { OHAENG_PULIE, OHAENG_KR, TG_KR, DZ_KR, type Myeongsik } from './saju';
import type { OhaengKey } from '../components/ie';
import { getIljuPulie } from './ilju-pulie';
import { getSinsal } from './sinsal';
import { getDaewoon, getSeun } from './daewoon';
import { getSipsung, type Sipsung } from './sipsung';

export type ReportOutline = {
  /** 결제 버튼 위 큰 글씨 — 이 사주에서 가장 두드러진 특징 */
  headline: string;
  chapters: { no: 1 | 2; title: string; items: string[] }[];
};

/* ─── 오행 생극 ────────────────────────────────────────────── */
const SAENG: Record<OhaengKey, OhaengKey> = {   // A 가 B 를 생한다
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
const GEUK: Record<OhaengKey, OhaengKey> = {    // A 가 B 를 극한다
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};
const TG_OHAENG: Record<string, OhaengKey> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
};
const DZ_OHAENG: Record<string, OhaengKey> = {
  寅: 'wood', 卯: 'wood', 巳: 'fire', 午: 'fire', 辰: 'earth', 戌: 'earth',
  丑: 'earth', 未: 'earth', 申: 'metal', 酉: 'metal', 亥: 'water', 子: 'water',
};

/** 십성을 한 단어로 — 목차에서 "무엇과 무엇이 만나는지" 읽히게 */
const SIPSUNG_WORD: Record<Sipsung, string> = {
  비견: '대등함', 겁재: '경쟁', 식신: '표현', 상관: '자기 목소리',
  편재: '기회', 정재: '성실함', 편관: '압박', 정관: '책임',
  편인: '통찰', 정인: '배움',
};

function hasBatchim(w: string): boolean {
  const c = w.charCodeAt(w.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}
/** 받침에 맞는 조사를 붙여 반환 */
const 이가 = (w: string) => `${w}${hasBatchim(w) ? '이' : '가'}`;
const 을를 = (w: string) => `${w}${hasBatchim(w) ? '을' : '를'}`;
const 과와 = (w: string) => `${w}${hasBatchim(w) ? '과' : '와'}`;

const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
const ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
function ageKo(age: number): string {
  if (age < 10 || age > 99) return `${age}세`;
  return `${TENS[Math.floor(age / 10)]}${ONES[age % 10]}` || `${age}세`;
}

/* ─── 한 줄 요약 ───────────────────────────────────────────── */
function buildHeadline(ms: Myeongsik): string {
  const counts = ms.ohaeng;
  const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
  const yong = ms.shinkang.yongshin.ohaeng;
  const yongWord = OHAENG_PULIE[yong];
  const n = counts[yong] ?? 0;

  if (n === 0) return `가장 필요한 ${이가(yongWord)} 하나도 없는 사주`;
  if (n === 1) return `가장 필요한 ${이가(yongWord)} 하나뿐인 사주`;

  const zero = (Object.keys(counts) as OhaengKey[]).find((k) => counts[k] === 0);
  if (zero) return `${이가(OHAENG_PULIE[zero])} 하나도 없는 사주`;

  const top = (Object.keys(counts) as OhaengKey[]).reduce((a, b) => (counts[b] > counts[a] ? b : a));
  if (counts[top] >= Math.ceil(total * 0.5)) {
    return `${total}글자 중 ${counts[top]}개가 ${OHAENG_PULIE[top]}인 사주`;
  }
  const ilju = getIljuPulie(ms.ilgan.c, ms.pillars[2].bot.c);
  return ilju ? `${ilju.symbol}, ${ilju.name}` : '다섯 기운이 고르게 퍼진 사주';
}

/* ─── 1장: 조각이 맞물리는 자리 ────────────────────────────── */
function buildLinks(ms: Myeongsik): string[] {
  const out: string[] = [];
  const ilganC = ms.ilgan.c;
  const ilji = ms.pillars[2].bot;
  const yong = ms.shinkang.yongshin.ohaeng;
  const yongWord = OHAENG_PULIE[yong];
  const yongCount = ms.ohaeng[yong] ?? 0;

  // 1) 일간과 일지 — 늘 있는 자리라 첫 항목으로
  if (ms.ilgan.ohaeng === ilji.ohaeng) {
    const e = OHAENG_KR[ms.ilgan.ohaeng];
    out.push(`${TG_KR[ilganC]}${e}와 ${DZ_KR[ilji.c]}${e}, 같은 기운이 겹친 자리`);
  } else {
    const ilju = getIljuPulie(ilganC, ilji.c);
    out.push(ilju ? `${ilju.name} — ${ilju.symbol}` : `${TG_KR[ilganC]}${DZ_KR[ilji.c]} 일주`);
  }

  // 2) 월주와 시주의 십성이 만나는 자리 — 사회적 자리와 속마음이 부딪히거나 맞물린다
  const month = ms.pillars[1];
  const hour = ms.pillars.length > 3 ? ms.pillars[3] : null;
  const mS = getSipsung(ilganC as never, month.top.c as never) as Sipsung | null;
  const hS = hour ? (getSipsung(ilganC as never, hour.top.c as never) as Sipsung | null) : null;

  if (mS && hS && mS !== hS) {
    out.push(`${과와(SIPSUNG_WORD[mS])} ${이가(SIPSUNG_WORD[hS])} 만나는 자리`);
  } else if (mS && hS && mS === hS) {
    out.push(`${이가(SIPSUNG_WORD[mS])} 두 번 겹친 자리`);
  } else if (mS) {
    out.push(`${SIPSUNG_WORD[mS]}(${mS})이 놓인 자리`);
  }

  // 3) 보유 신살과 부족한 기운이 겹치는 지점
  const owned = getSinsal(ms).filter((s) => s.has);
  if (owned.length > 0) {
    const names = owned.slice(0, 2).map((s) => s.name).join('·');
    out.push(yongCount <= 1
      ? `${이가(names)} ${yongCount === 0 ? '없는' : '하나뿐인'} ${과와(yongWord)} 겹칠 때`
      : `${이가(names)} 함께 있을 때`);
  }

  // 4) 신강신약 판정이 나머지 전부와 맞물리는 방식
  out.push(yongCount <= 1
    ? `${ms.shinkang.label} 사주에서 ${이가(yongWord)} 모자랄 때`
    : `${ms.shinkang.label} 사주에서 ${이가(yongWord)} 하는 일`);

  return out;
}

/* ─── 2장: 구조가 시기와 만날 때 ───────────────────────────── */
function buildTimeLinks(
  ms: Myeongsik,
  profile: { year: number; gender: 'male' | 'female' },
): string[] {
  const out: string[] = [];
  const yong = ms.shinkang.yongshin.ohaeng;
  const yongWord = OHAENG_PULIE[yong];
  const yongCount = ms.ohaeng[yong] ?? 0;

  const daewoon = getDaewoon(ms, profile);
  const seun = getSeun(ms, profile);
  const cur = daewoon.find((d) => d.isCurrent);
  const thisYear = seun.find((s) => s.isCurrent);
  if (!cur || !thisYear) return out;

  // 1) 지금 대운의 지지가 부족한 기운인가 — 여기가 이 리포트의 중심 서사가 된다
  const curBranch = DZ_OHAENG[cur.branch];
  if (curBranch === yong) {
    const how = yongCount === 0 ? '없던' : yongCount === 1 ? '하나뿐이던' : '';
    out.push(`${how} ${이가(yongWord)} 채워지고 있는 10년`.trim());
  } else {
    out.push(`${cur.label} 대운이 ${ageKo(thisYear.age)}의 나를 미는 방향`);
  }

  // 2) 올해 기운이 부족한 기운을 돕는지 누르는지
  const yStem = TG_OHAENG[thisYear.stem];
  const yBranch = DZ_OHAENG[thisYear.branch];
  const yw = OHAENG_PULIE[yStem];
  const pressing = GEUK[yStem] === yong || GEUK[yBranch] === yong;
  const helping = yStem === yong || yBranch === yong
    || SAENG[yStem] === yong || SAENG[yBranch] === yong;

  const same = yStem === yong || yBranch === yong;
  if (pressing) out.push(`${thisYear.year}년, 들어온 ${이가(yw)} ${을를(yongWord)} 누른다`);
  else if (same) out.push(`${thisYear.year}년, 모자란 ${이가(yongWord)} 하나 더 들어온다`);
  else if (helping) out.push(`${thisYear.year}년, 들어온 ${이가(yw)} ${을를(yongWord)} 돕는다`);
  else out.push(`${thisYear.year}년 ${thisYear.label}, ${thisYear.sipsung ?? ''}의 해`);

  // 3) 다음 대운에서 무엇이 바뀌는가
  const next = daewoon.find((d) => d.age === cur.age + 10);
  if (next) out.push(`${ageKo(next.age)}, ${next.label}로 바뀔 때 달라지는 것`);

  // 4) 부족한 기운이 처음으로 천간에 올라오는 대운 — 진짜 전환점
  const rise = daewoon.find((d) => d.age > cur.age && TG_OHAENG[d.stem] === yong);
  if (rise) out.push(`${ageKo(rise.age)}, ${이가(yongWord)} 처음 위로 올라오는 시기`);

  return out;
}

export function buildReportOutline(
  ms: Myeongsik,
  profile: { year: number; gender: 'male' | 'female' },
): ReportOutline {
  return {
    headline: buildHeadline(ms),
    chapters: [
      { no: 1, title: '조각이 맞물리는 자리', items: buildLinks(ms) },
      { no: 2, title: '그 구조가 시기와 만나면', items: buildTimeLinks(ms, profile) },
    ],
  };
}
