import { THAI_DAYS, type ThaiDayKey } from './thai-astrology';

/**
 * 태국 점성술 심화 콘텐츠 — 전부 미리 집필된 정적 테이블 + 조회 빌더.
 *
 * - 오늘의 요일운: 나와그라하(9요성) 전통 우호 관계표 기반 — 내 수호 행성 × 오늘 요일의 지배 행성
 * - 관계 3단계(우호/중립/긴장) × 문장 변형 → 개인시드+날짜 해시로 선택 (luck-guide 패턴)
 * - 행운 숫자는 태국 사원의 요일별 촛불 수 전통, 방위는 요일 불상 배치 방위(통용 기준, 출처별 차이 존재)
 * - 풀이 원칙: 쉬운 일상어, 짧은 문장, 겁주지 않기
 */

/* ── 나와그라하 관계표 ─────────────────────────────── */

export type Relation = 'friend' | 'neutral' | 'tension';

/** 오늘의 지배 행성 키 — 달력 요일 7개 (라후는 사람에게만 있는 구분) */
export type TodayKey = Exclude<ThaiDayKey, 'wedNight'>;

/** 내 수호 행성(8) → 상대 행성(8) 관계. 베다 전통 자연 우호표 단순화 */
const REL: Record<ThaiDayKey, Record<ThaiDayKey, Relation>> = {
  sun: { sun: 'friend', mon: 'friend', tue: 'friend', wedDay: 'neutral', wedNight: 'tension', thu: 'friend', fri: 'tension', sat: 'tension' },
  mon: { sun: 'friend', mon: 'friend', tue: 'neutral', wedDay: 'friend', wedNight: 'tension', thu: 'neutral', fri: 'neutral', sat: 'neutral' },
  tue: { sun: 'friend', mon: 'friend', tue: 'friend', wedDay: 'tension', wedNight: 'tension', thu: 'friend', fri: 'neutral', sat: 'neutral' },
  wedDay: { sun: 'friend', mon: 'tension', tue: 'neutral', wedDay: 'friend', wedNight: 'friend', thu: 'neutral', fri: 'friend', sat: 'neutral' },
  wedNight: { sun: 'tension', mon: 'tension', tue: 'tension', wedDay: 'friend', wedNight: 'friend', thu: 'neutral', fri: 'friend', sat: 'friend' },
  thu: { sun: 'friend', mon: 'friend', tue: 'friend', wedDay: 'tension', wedNight: 'neutral', thu: 'friend', fri: 'tension', sat: 'neutral' },
  fri: { sun: 'tension', mon: 'tension', tue: 'neutral', wedDay: 'friend', wedNight: 'friend', thu: 'neutral', fri: 'friend', sat: 'friend' },
  sat: { sun: 'tension', mon: 'tension', tue: 'tension', wedDay: 'friend', wedNight: 'friend', thu: 'neutral', fri: 'friend', sat: 'friend' },
};

/** 달력 요일(0=일) → 오늘 키 */
const TODAY_BY_DOW: TodayKey[] = ['sun', 'mon', 'tue', 'wedDay', 'thu', 'fri', 'sat'];

/** 표시용 요일명 (오늘 문장용 — '수요일 낮' 대신 '수요일') */
const TODAY_LABEL: Record<TodayKey, string> = {
  sun: '일요일', mon: '월요일', tue: '화요일', wedDay: '수요일', thu: '목요일', fri: '금요일', sat: '토요일',
};

/* ── 오늘의 요일운 ─────────────────────────────────── */

/** 간단 문자열 해시 — 같은 시드+날짜는 항상 같은 문장 (luck-guide 패턴) */
function miniHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

type Tier = 'mine' | Relation;

/** 본문 템플릿 — {ruler}=오늘의 행성신, {my}=내 수호신. 변형 3개씩 */
const TODAY_LINES: Record<Tier, string[]> = {
  mine: [
    '오늘은 내 수호신 {ruler}의 날이에요. 일주일 중 내 기운이 가장 잘 통하는 날이니, 미뤄둔 일을 오늘 꺼내보세요.',
    '내 수호신 {ruler}의 날이 돌아왔어요. 평소보다 감이 잘 맞는 날이라, 내 생각을 믿고 움직여도 좋아요.',
    '일주일에 한 번 돌아오는 나의 날이에요. 중요한 약속이나 시작하고 싶던 일이 있다면 오늘이 적기예요.',
  ],
  friend: [
    '오늘을 다스리는 {ruler} — 내 수호신 {my}와 잘 통하는 사이예요. 일이 평소보다 수월하게 풀리는 날이에요.',
    '{ruler}의 날은 {my}의 사람에게 순풍이에요. 부탁할 일이 있다면 오늘 꺼내보세요. 답이 부드럽게 돌아와요.',
    '내 수호신과 친한 {ruler}의 날이라, 사람 만나는 자리가 특히 좋아요. 오늘의 대화는 기분 좋게 남아요.',
  ],
  neutral: [
    '오늘을 다스리는 {ruler}와 내 수호신 {my}는 서로 무던한 사이예요. 크게 밀어주지도 막지도 않는, 내 하기 나름인 날이에요.',
    '{ruler}의 날은 {my}의 사람에게 잔잔해요. 특별한 바람이 없는 날이니, 평소 페이스를 지키는 게 제일 좋아요.',
    '무난하게 흘러가는 날이에요. 큰 결정보다는 하던 일을 차곡차곡 정리하기 좋은 하루예요.',
  ],
  tension: [
    '오늘을 다스리는 {ruler} — 내 수호신 {my}와는 기운이 살짝 엇갈리는 사이예요. 나쁜 날이 아니라, 서두르면 꼬이기 쉬운 날이에요.',
    '{ruler}의 날엔 {my}의 사람 마음이 평소보다 조급해지기 쉬워요. 오늘은 한 템포 늦추는 게 오히려 빨라요.',
    '기운이 어긋나기 쉬운 날이에요. 중요한 말일수록 한 번 더 생각하고 꺼내면, 오늘도 무사히 지나가요.',
  ],
};

/** 실용 팁 — 변형 3개씩 */
const TODAY_TIPS: Record<Tier, string[]> = {
  mine: [
    '오늘의 팁: 내 행운색을 하나 몸에 지니면 나의 날이 더 든든해져요.',
    '오늘의 팁: 나를 위한 시간을 30분만 떼어두세요. 나의 날엔 그게 충전이 돼요.',
    '오늘의 팁: 미뤄둔 연락 하나를 오늘 보내보세요. 타이밍이 좋아요.',
  ],
  friend: [
    '오늘의 팁: 협업이나 상의는 오후로 미루지 말고 바로 하는 게 좋아요.',
    '오늘의 팁: 고마웠던 사람에게 짧게 마음을 전해보세요. 배로 돌아오는 날이에요.',
    '오늘의 팁: 새 아이디어를 꺼내기 좋은 날이에요. 가볍게라도 말해보세요.',
  ],
  neutral: [
    '오늘의 팁: 무리한 약속을 새로 잡기보다, 이미 있는 일을 마무리해 보세요.',
    '오늘의 팁: 몸을 조금 움직이면 잔잔한 날에 활기가 돌아요. 짧은 산책이 좋아요.',
    '오늘의 팁: 지갑 정리, 메모 정리처럼 작은 정돈이 잘 되는 날이에요.',
  ],
  tension: [
    '오늘의 팁: 답장은 천천히, 결제는 한 번 더 확인하고 누르세요.',
    '오늘의 팁: 피곤하면 무리하지 말고 일찍 쉬는 게 오늘의 정답이에요.',
    '오늘의 팁: 오늘 들은 거슬리는 말은 하루 재웠다가 내일 다시 생각해 보세요.',
  ],
};

/** 등급 표시 (칩) */
const GRADE_BY_TIER: Record<Tier, { label: string; color: string }> = {
  mine: { label: '나의 날 ✦', color: '#FFD27A' },
  friend: { label: '순풍', color: '#5CB271' },
  neutral: { label: '잔잔함', color: '#8FA3C8' },
  tension: { label: '한 템포 쉬어가기', color: '#E8A15D' },
};

export type ThaiToday = {
  /** 오늘 요일 표시명 */
  todayLabel: string;
  /** 오늘의 지배 행성신 이름 */
  rulerName: string;
  /** 카드 제목용 — 쉬운 별칭+이름 (예: '달의 신 찬드라') */
  rulerLabel: string;
  tier: Tier;
  grade: { label: string; color: string };
  line: string;
  tip: string;
};

/** 오늘의 요일운 — 내 탄생 요일 × 오늘 지배 행성 관계 조회 + 시드 변형 */
export function buildThaiToday(myKey: ThaiDayKey, date: Date, personalSeed: string): ThaiToday {
  const todayKey = TODAY_BY_DOW[date.getDay()];
  const rulerName = THAI_DAYS[todayKey].deity.name;
  const rulerLabel = `${THAI_DAYS[todayKey].deity.plain} ${rulerName}`;
  const myName = THAI_DAYS[myKey].deity.name;
  // 내 요일과 오늘 요일이 같으면 '나의 날' (라후는 수요일이 나의 날)
  const isMine = myKey === todayKey || (myKey === 'wedNight' && todayKey === 'wedDay');
  const tier: Tier = isMine ? 'mine' : REL[myKey][todayKey];

  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const h = miniHash(personalSeed + ymd);
  const fill = (s: string) => s.replace('{ruler}', rulerName).replace('{my}', myName);

  return {
    todayLabel: TODAY_LABEL[todayKey],
    rulerName,
    rulerLabel,
    tier,
    grade: GRADE_BY_TIER[tier],
    line: fill(TODAY_LINES[tier][h % TODAY_LINES[tier].length]),
    tip: fill(TODAY_TIPS[tier][(h >> 3) % TODAY_TIPS[tier].length]),
  };
}

/* ── 요일 궁합 (잘 맞는 요일 / 조심할 요일) ───────────── */

export type ThaiMatch = { good: string[]; hard: string[] };

/** 내 수호 행성과 우호/긴장인 '태어난 요일' 목록 (사람 궁합용, 자기 자신 제외) */
export function buildThaiMatch(myKey: ThaiDayKey): ThaiMatch {
  const good: string[] = [];
  const hard: string[] = [];
  (Object.keys(REL[myKey]) as ThaiDayKey[]).forEach((k) => {
    if (k === myKey) return;
    const rel = REL[myKey][k];
    if (rel === 'friend') good.push(THAI_DAYS[k].weekdayKr);
    if (rel === 'tension') hard.push(THAI_DAYS[k].weekdayKr);
  });
  return { good, hard };
}

/* ── 성격 심화 — 겉모습 / 속마음 / 강점 / 조심할 점 ────── */

export type ThaiDeep = { look: string; inside: string; strength: string; care: string };

export const THAI_DEEP: Record<ThaiDayKey, ThaiDeep> = {
  sun: {
    look: '처음 만나도 오래 본 사람처럼 밝고 당당해 보여요. 목소리와 표정에 힘이 있어서, 여럿이 모이면 자연스럽게 시선이 모여요.',
    inside: '겉은 씩씩한데, 속으로는 "나 잘하고 있나" 스스로에게 꽤 엄격해요. 칭찬을 들어도 겉으론 웃고, 속으로는 오래 곱씹는 편이에요.',
    strength: '사람들을 끌고 가는 힘이에요. 다들 망설일 때 먼저 "이렇게 해보자"라고 말할 수 있는 사람이라, 맡으면 어떻게든 해내요.',
    care: '자존심이 다치면 생각보다 오래 아파요. 도움을 청하는 건 지는 게 아니에요 — 그걸 받아들이면 훨씬 가벼워져요.',
  },
  mon: {
    look: '부드럽고 편안한 인상이라 사람들이 곁을 쉽게 내줘요. 말수가 많지 않아도 어딘가 은은하게 기억에 남는 타입이에요.',
    inside: '속은 감정의 밀물과 썰물이 있어요. 아무렇지 않아 보여도 작은 말 한마디를 며칠씩 품고 있을 때가 있죠.',
    strength: '기억력과 공감이에요. 상대가 지나가듯 한 말을 기억해뒀다가 챙겨주는 사람이라, 곁에 오래 남는 인연이 많아요.',
    care: '남의 감정을 스펀지처럼 흡수해서 지치기 쉬워요. 하루에 한 번은 내 마음만 들여다보는 시간이 필요해요.',
  },
  tue: {
    look: '시원시원하고 화끈해 보여요. 좋고 싫음이 얼굴에 다 드러나는 편이라, 오히려 뒤가 없어 보여서 믿음이 가요.',
    inside: '겉은 강한데 속은 의외로 단순하고 뜨거워요. 화가 나도 금방 풀리고, 미안하면 티가 다 나는 사람이에요.',
    strength: '실행력이에요. 남들이 계획만 세울 때 이미 몸이 움직이고 있어요. 위기 상황에서 제일 먼저 뛰어드는 것도 이 사람이죠.',
    care: '욱하는 순간의 말이 제일 큰 적이에요. 화가 올라올 땐 딱 열을 세고 말하면, 인생의 절반이 편해져요.',
  },
  wedDay: {
    look: '말을 잘하고 눈치가 빨라서 어느 자리든 금방 스며들어요. 처음 보는 사람과도 10분이면 아는 사이처럼 대화해요.',
    inside: '머릿속이 쉬지 않아요. 말은 가볍게 해도 속으로는 여러 수를 계산하고 있고, 생각이 많아 잠들기 어려운 밤도 있어요.',
    strength: '연결하는 재주예요. 사람과 사람, 정보와 기회를 잇는 데 타고났어요. 장사·협상·중재가 필요한 곳에서 빛나요.',
    care: '말이 빠른 만큼 가끔 말이 앞서요. 중요한 자리에서는 한 박자 늦게 말하는 연습이 큰 재산이 돼요.',
  },
  wedNight: {
    look: '조용한데 이상하게 존재감이 있어요. 무슨 생각을 하는지 다 보여주지 않아서, 사람들이 궁금해하는 타입이에요.',
    inside: '남들과 같은 길이 답답해요. "이게 맞나?"라는 질문을 늘 품고 살고, 그래서 남들이 못 보는 걸 먼저 알아차려요.',
    strength: '직관과 위기 대응이에요. 상황이 흔들릴수록 오히려 침착해지는 드문 사람이라, 큰일이 났을 때 진가가 드러나요.',
    care: '힘든 걸 혼자 다 안고 가는 버릇이 있어요. 믿는 사람 한 명에게만이라도 미리 말해두면, 무너질 일이 줄어요.',
  },
  thu: {
    look: '차분하고 어른스러워 보여요. 나이와 상관없이 어딘가 "선생님 같다"는 말을 듣는 사람이에요.',
    inside: '기대에 부응해야 한다는 책임감을 무겁게 지고 있어요. 남에게는 너그러운데 자기 자신에게는 숙제를 많이 내주죠.',
    strength: '배우고 가르치는 힘이에요. 파고들면 끝을 보는 집중력이 있고, 사람들이 자연스럽게 조언을 구하러 와요.',
    care: '내 방식이 옳다는 확신이 강해질 때가 있어요. "그럴 수도 있겠네" 한마디를 자주 쓰면 관계가 한결 부드러워져요.',
  },
  fri: {
    look: '다정하고 호감 가는 인상이에요. 잘 웃고 리액션이 좋아서, 함께 있으면 기분이 좋아진다는 말을 자주 들어요.',
    inside: '사랑받고 싶은 마음이 커요. 거절당하는 게 유난히 아파서, 싫은 것도 좋다고 말해버릴 때가 있죠.',
    strength: '아름다움을 알아보는 눈과 사람을 잇는 온기예요. 예술 감각이 있고, 이 사람이 있는 모임은 분위기가 살아나요.',
    care: '거절을 못 해서 내 시간이 남의 일로 채워지기 쉬워요. "생각해 볼게요" 한마디가 나를 지키는 방패예요.',
  },
  sat: {
    look: '과묵하고 듬직해 보여요. 말수가 적어 차가워 보일 수 있지만, 겪어본 사람은 다 알아요 — 제일 의리 있는 사람이라는 걸.',
    inside: '속으로 생각이 깊고 걱정도 많아요. 내색하지 않을 뿐, 주변 사람들의 일을 혼자 오래 생각하고 있어요.',
    strength: '버티는 힘이에요. 남들이 포기하는 지점에서 한 걸음 더 가는 사람이라, 시간이 걸려도 결국 결과를 만들어요.',
    care: '마음을 너무 늦게 보여줘서 오해를 사요. 표현이 서툴면 행동 말고 말로도 가끔은 전해보세요 — 다들 기다리고 있어요.',
  },
};

/* ── 행운 디테일 — 숫자(요일 촛불 수 전통) · 방위(요일 불상 방위) ── */

export type ThaiLucky = { number: number; direction: string };

export const THAI_LUCKY: Record<ThaiDayKey, ThaiLucky> = {
  sun: { number: 6, direction: '북동쪽' },
  mon: { number: 15, direction: '동쪽' },
  tue: { number: 8, direction: '남동쪽' },
  wedDay: { number: 17, direction: '남쪽' },
  wedNight: { number: 12, direction: '북서쪽' },
  thu: { number: 19, direction: '서쪽' },
  fri: { number: 21, direction: '북쪽' },
  sat: { number: 10, direction: '남서쪽' },
};

/* ── 잘 맞는 일 — 요일별 직업 적성 (수호 행성의 기질 기반) ── */

export const THAI_WORK: Record<ThaiDayKey, [string, string, string]> = {
  sun: ['리더·운영', '무대·발표', '내 사업'],
  mon: ['상담·돌봄', '기록·글쓰기', '큐레이션'],
  tue: ['현장·운동', '영업·개척', '승부가 있는 일'],
  wedDay: ['마케팅·장사', '말·글로 하는 일', '중개·협상'],
  wedNight: ['기획·전략', '연구·탐구', '밤의 창작'],
  thu: ['교육·강의', '자문·멘토링', '깊이 파는 일'],
  fri: ['디자인·예술', '뷰티·스타일', '서비스·환대'],
  sat: ['기술·장인의 일', '관리·재무', '오래 걸리는 큰일'],
};

/* ── 궁합 심화 — "그 요일의 사람이 나에게 주는 것" + 제일 조심할 조합 ── */

/** 요일별 — 그 사람이 곁에서 주는 것 (한 줄) */
export const THAI_GIVES: Record<ThaiDayKey, string> = {
  sun: '앞장서서 끌어줘요',
  mon: '마음을 알아줘요',
  tue: '망설일 때 등을 밀어줘요',
  wedDay: '말문을 틔워줘요',
  wedNight: '말 안 해도 알아채요',
  thu: '길을 알려줘요',
  fri: '굳은 마음을 풀어줘요',
  sat: '묵묵히 기다려줘요',
};

/** 내 요일 → 제일 조심할 조합 한 쌍 + 구체적 이유 (겁주지 않는 톤) */
export const THAI_WORST: Record<ThaiDayKey, { day: ThaiDayKey; reason: string }> = {
  sun: { day: 'sat', reason: '둘 다 먼저 굽히질 않아서, 침묵 대치가 길어지기 쉬워요.' },
  mon: { day: 'wedNight', reason: '둘 다 속을 잘 안 보여줘서, 오해가 소리 없이 쌓여요.' },
  tue: { day: 'wedDay', reason: '한 명은 몸이 먼저, 한 명은 말이 먼저라 자꾸 엇갈려요.' },
  wedDay: { day: 'mon', reason: '말은 많이 하는데, 정작 마음 얘기는 둘 다 안 꺼내요.' },
  wedNight: { day: 'tue', reason: '한 명은 들이대고 한 명은 한 발 물러서서, 타이밍이 안 맞아요.' },
  thu: { day: 'fri', reason: '바른말과 달콤한 말이 부딪혀요. 조언이 잔소리로 들리는 사이예요.' },
  fri: { day: 'sun', reason: '관심받는 걸 나눠 갖기 싫은 두 사람이라, 은근한 질투가 생겨요.' },
  sat: { day: 'tue', reason: '빨리 가자는 사람과 천천히 가자는 사람이라, 서로 답답해지기 쉬워요.' },
};

/** 궁합 표시용 행 — 잘 맞는 요일들을 (요일명, 주는 것) 쌍으로 */
export function buildThaiMatchRows(myKey: ThaiDayKey): { weekdayKr: string; gives: string; hex: string }[] {
  return (Object.keys(REL[myKey]) as ThaiDayKey[])
    .filter((k) => k !== myKey && REL[myKey][k] === 'friend')
    .map((k) => ({ weekdayKr: THAI_DAYS[k].weekdayKr, gives: THAI_GIVES[k], hex: THAI_DAYS[k].accent ?? THAI_DAYS[k].color.hex }));
}
