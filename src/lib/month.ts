import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import type { Myeongsik } from './saju';
import { profileHint, rotateBySeed } from './personalize';

/**
 * 이달의 운세 — 본인 일간 × 이번 달 월주 천간 → 십성 → 4분야 점수.
 * 이번 달 일별 일진(30~31일) → best/worst 날짜.
 * 키워드 3 + 행동 가이드 3 = 광고 1회 본 보상으로 적당한 분량.
 */

function variance(seed: string, key: string, range = 3): number {
  let h = 0;
  const s = seed + key;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % (range * 2 + 1)) - range;
}
function myeongsikSeed(m: Myeongsik): string {
  return m.pillars.map((p) => p.top.c + p.bot.c).join('');
}

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const isStem = (s: string): s is Stem => (STEMS as string[]).includes(s);

/** 십성별 4분야 점수 (총운·일·연애·돈) */
export const SCORE: Record<Sipsung, { overall: number; work: number; love: number; money: number }> = {
  비견: { overall: 72, work: 78, love: 68, money: 65 },
  겁재: { overall: 65, work: 72, love: 60, money: 58 },
  식신: { overall: 84, work: 80, love: 88, money: 76 },
  상관: { overall: 78, work: 84, love: 72, money: 70 },
  정재: { overall: 80, work: 78, love: 76, money: 88 },
  편재: { overall: 82, work: 75, love: 78, money: 90 },
  정관: { overall: 75, work: 88, love: 78, money: 72 },
  편관: { overall: 68, work: 78, love: 65, money: 65 },
  정인: { overall: 78, work: 75, love: 72, money: 70 },
  편인: { overall: 72, work: 72, love: 75, money: 65 },
};

const MOOD: Record<Sipsung, string> = {
  비견: '협력의 달', 겁재: '경쟁의 달',
  식신: '꽃피는 달', 상관: '창의의 달',
  정재: '안정의 달', 편재: '기회의 달',
  정관: '책임의 달', 편관: '도전의 달',
  정인: '배움의 달', 편인: '직관의 달',
};

const TAGLINE: Record<Sipsung, string> = {
  비견: '함께할 사람이 늘어나는 달',
  겁재: '경쟁 속에서 단단해지는 달',
  식신: '하고 싶은 거 펼치는 달',
  상관: '새 아이디어가 빛나는 달',
  정재: '꾸준히 쌓이는 안정의 달',
  편재: '예상 못한 기회가 들어오는 달',
  정관: '책임이 보상으로 돌아오는 달',
  편관: '한 단계 성장하는 도전의 달',
  정인: '배우고 채우는 달',
  편인: '직관·영감이 빛나는 달',
};

const KEYWORDS: Record<Sipsung, [string, string, string]> = {
  비견: ['#팀워크', '#함께가기', '#협업'],
  겁재: ['#승부욕', '#한박자쉬기', '#충동주의'],
  식신: ['#표현', '#럭키비키', '#매력UP'],
  상관: ['#아이디어', '#새시도', '#톤조절'],
  정재: ['#안정', '#차곡차곡', '#적금'],
  편재: ['#기회', '#횡재신호', '#네트워크'],
  정관: ['#신뢰', '#정공법', '#약속'],
  편관: ['#정면돌파', '#성장', '#휴식필수'],
  정인: ['#배움', '#멘토', '#정리'],
  편인: ['#직관', '#영감', '#큰결정미루기'],
};

/** 십성별 한 달 흐름 풀이 (3~4줄) */
const MONTH_BODY: Record<Sipsung, string> = {
  비견: '함께할 사람이 늘어나는 달이에요. 혼자 끌고 가던 일도 동료·친구의 손을 빌리면 두 배 가벼워져요. 사람 만나는 자체가 운이라 모임·공동 작업·팀 프로젝트에 적극 참여해주세요. 단 책임 분배는 처음부터 명확히 정해두세요.',
  겁재: '경쟁 에너지가 강한 달이에요. 라이벌·시험·면접·경쟁 자리에 강한 흐름이지만 충동·과욕도 함께 와요. 큰 결정·강한 발언은 한 박자 쉰 뒤에 다시 봐주세요. 큰 지출·도박은 이번 달엔 피해주세요.',
  식신: '하고 싶은 거 마음껏 펼치는 달이에요. 표현·창작·발표·매력 어필에 좋은 시기예요. 새로운 시도·이직·콘텐츠 제작을 검토하기 좋은 타이밍이에요. 즐기되 기록만 남겨두면 충분해요.',
  상관: '틀을 깨는 발상이 빛나는 달이에요. 평범하지 않은 길에서 본인만의 답을 찾는 시기예요. 부업·사이드 프로젝트·콘텐츠 수익화 검토가 좋아요. 단 직설적인 발언으로 사람 잃지 않게 톤은 한 번 더 신경 써주세요.',
  정재: '꾸준히 쌓이는 안정의 달이에요. 큰 변동 없이 계획대로 가면 그게 정답이에요. 적금·예금·계약 갱신 점검에 좋은 시기예요. 새 모험보단 어제 약속한 것 마무리에 집중해주세요.',
  편재: '예상 못한 기회·만남이 들어오는 달이에요. 안전한 자리에만 있으면 운 절반을 놓치니 새로운 자리·사람을 적극적으로 만나주세요. 횡재·부수입·환급 신호도 살짝 와요. 단 큰 베팅은 충분히 검증한 뒤에 결정해주세요.',
  정관: '책임이 보상으로 돌아오는 달이에요. 약속·신뢰·정공법이 그대로 운으로 와요. 윗사람·고객·평가자에게 인정받기 좋은 시기예요. 단 무리·번아웃이 올 수 있으니 잠은 꼭 챙겨주세요.',
  편관: '압박·과제 많지만 정면 돌파하면 한 단계 성장하는 달이에요. 도망치지 말고 한 가지씩 처리해주세요. 단 갈등·다툼·갑작스러운 지출도 함께 올 수 있으니 비상금·결제 한도를 확인해두세요.',
  정인: '배우고 채우는 달이에요. 큰 도약보단 내공 쌓기에 집중하기 좋은 시기예요. 멘토·자료·강의를 만나는 신호가 와요. 책 한 권·강의 하나가 한 달 자산이 돼요.',
  편인: '직관·영감이 빛나는 달이에요. 평범하지 않은 길에서 본인만의 답을 찾는 시기예요. 단 큰 결정·투자·계약은 일단 미뤄주세요. 직감만 믿고 큰 결정 내리는 건 위험해요.',
};

/** 십성별 행동 가이드 3개 — 클릭 시 펼쳐지는 detail 포함 */
const MONTH_ACTIONS: Record<Sipsung, Array<{ ic: string; lbl: string; sub: string; detail: string }>> = {
  비견: [
    { ic: '🤝', lbl: '동료와 함께',     sub: '협업 자리에 운',
      detail: '이번 달 같이 일하는 동료에게 점심·커피를 먼저 제안해보세요. 비견이 강한 달은 같은 결의 사람들과 손 잡으면 두 배로 풀려요. 단 책임 분배는 처음부터 명확히 정해두세요 — 모호하면 나중에 갈등이 돼요.' },
    { ic: '👥', lbl: '모임 참여',       sub: '의외의 인연 상승',
      detail: '친구·동호회·동창회 같은 모임에 한 번이라도 참여해보세요. 친구의 친구를 통해 의외의 인연·정보·기회가 들어오는 흐름이에요. 새 사람 만날 자리에 한 번만 가도 한 달 운이 풀려요.' },
    { ic: '📋', lbl: '책임 분배 명확',   sub: '나중에 불씨 차단',
      detail: '팀 작업·공동 프로젝트에서 누가 뭘 맡을지 처음부터 명확히 적어두세요. 비견의 달은 협업 흐름이 강하지만 책임이 모호하면 나중에 갈등이 커져요. 문서·메모로 남겨두면 안전해요.' },
  ],
  겁재: [
    { ic: '⚠️', lbl: '큰 결정 보류',    sub: '24시간 룰',
      detail: '큰 지출·계약·투자는 결정 전 24시간 미루는 룰을 지켜주세요. 겁재의 달은 충동·과욕이 강해서 충동 결정이 며칠 뒤 후회로 돌아와요. 잠 한 번 자고 다시 봐도 좋으면 그때 결정해도 늦지 않아요.' },
    { ic: '🧘', lbl: '한 박자 쉬기',    sub: '발끈하지 않기',
      detail: '사소한 말투·SNS 글에 발끈해서 답할 것 같으면 한 번 호흡 깊게 들이마시고 멈춰주세요. 겁재가 강한 달은 평소보다 예민해져요. 화났을 때 보낸 메시지는 다음 날 후회로 와요.' },
    { ic: '💸', lbl: '충동 결제 주의',   sub: '이번 달은 절약',
      detail: 'SNS 광고·한정판·세일 알림에 흔들릴 수 있는 달이에요. 결제 직전에 24시간 미루는 룰만 지켜도 절반은 막아져요. 이번 달은 평소보다 한 끼 가볍게 가는 마인드가 답이에요.' },
  ],
  식신: [
    { ic: '✨', lbl: '새 시도 OK',      sub: '매력이 빛나는 달',
      detail: '평소 안 입던 색·머리 스타일·향수·취미를 한 번 시도해보세요. 식신의 달은 표현·매력이 자연스럽게 빛나는 시기라 새 시도가 다 운으로 와요. 작게 한 가지만 해도 충분해요.' },
    { ic: '📝', lbl: '기록 남기기',     sub: '들떠서 깜빡 주의',
      detail: '기분이 좋아서 약속·할 일을 깜빡할 수 있는 달이에요. 캘린더·메모·할 일 리스트를 한 번 더 챙겨두세요. 즐기는 건 좋지만 기록만 남겨두면 다음 달까지 그 운이 이어져요.' },
    { ic: '🎨', lbl: '창작 활동',       sub: '취미 수익화 검토',
      detail: '그림·글·요리·영상 같은 취미를 SNS·플랫폼에 올려보세요. 식신은 창작·표현이 운으로 돌아오는 시기라 작은 콘텐츠도 의외의 반응이 와요. 완벽하게 X — 일단 올리는 게 답이에요.' },
  ],
  상관: [
    { ic: '💡', lbl: '아이디어 메모',    sub: '한 줄이 시드',
      detail: '샤워하다·산책하다 떠오르는 아이디어를 한 줄이라도 메모해두세요. 상관의 달은 발상이 평소 두 배로 또렷해요. 메모 없이 흘려보내면 그 자리에서 끝, 적어두면 한 달 후 자산이 돼요.' },
    { ic: '🔥', lbl: '부업 검토',       sub: '사이드 프로젝트',
      detail: '본업 외 부업·사이드 프로젝트·콘텐츠 수익화를 검토해보세요. 상관의 달은 새 길을 만들기 좋은 시기예요. 단 즉흥적으로 큰 투자는 X — 메모만 해두고 다음 달 다시 보고 결정해주세요.' },
    { ic: '🎤', lbl: '톤 조절',        sub: '직설보다 부드럽게',
      detail: '옳은 말이라도 직설적으로 던지면 가시처럼 박힐 수 있는 달이에요. "이건 이상해" 대신 "이렇게 해보면 어때?"로 바꿔주세요. 같은 내용도 매력으로 들려요.' },
  ],
  정재: [
    { ic: '💰', lbl: '적금 점검',       sub: '이율 비교 타이밍',
      detail: '예금·적금 만기 일정과 이율을 한 번 비교해보세요. 정재의 달은 안정·정리가 답이라 새 투자보단 기존 자산 재배치가 큰 이익으로 와요. 5분만 투자해도 한 달치 추가 수익이 돼요.' },
    { ic: '📊', lbl: '계약 갱신',       sub: '꼼꼼히 읽고',
      detail: '월세·보험·구독 서비스 계약 갱신·해지 챙기기 좋은 달이에요. 약관 한 번 더 읽고 사인해주세요. 정재의 달은 작은 정리가 다음 달 큰 절약으로 돌아와요.' },
    { ic: '🧾', lbl: '서류 정리',       sub: '연말정산 미리',
      detail: '영수증·기부 영수증·의료비 서류를 미리 모아두세요. 연말 한 번에 몰리면 빠지는 게 생겨요. 정재 달은 차곡차곡 정리하는 자체가 그대로 환급으로 돌아와요.' },
  ],
  편재: [
    { ic: '🎯', lbl: '새 자리 가기',    sub: '낯선 곳에 운',
      detail: '평소 안 가던 카페·전시·모임 자리에 한 번 가보세요. 편재의 달은 익숙한 자리에만 있으면 운 절반을 놓쳐요. 의외의 정보·기회·만남이 낯선 곳에서 들어와요.' },
    { ic: '📞', lbl: '오랜 연락',       sub: '의외의 기회',
      detail: '한동안 연락 못 한 사람한테 안부 메시지 한 번 보내주세요. 편재가 강한 달은 오랜 인맥에서 의외의 기회·일이 들어와요. 짧은 인사 한 줄로도 충분해요.' },
    { ic: '💡', lbl: '횡재 안테나',     sub: '환급·캐시백 확인',
      detail: '잊고 있던 환급·캐시백·당첨 알림·포인트를 한 번 정리해보세요. 편재의 달은 작은 횡재 신호가 의외로 자주 와요. 단 큰 베팅은 X — 작은 돈만 받아주세요.' },
  ],
  정관: [
    { ic: '💼', lbl: '약속 지키기',     sub: '신뢰 상승',
      detail: '이번 달은 작은 약속도 한 번 더 지켜주세요. 정관의 달은 신뢰가 곧 운이라 작은 디테일까지 챙기면 윗사람·고객·평가자가 "이 사람 진짜네" 신호를 보내요.' },
    { ic: '🎓', lbl: '평가 준비',       sub: '윗사람 인정',
      detail: '면담·평가·발표가 있다면 정공법으로 준비해주세요. 정관 달은 화려한 트릭보다 묵묵한 신뢰가 빛나는 시기예요. 평소 안 보이던 디테일까지 챙기면 인정이 자연스럽게 따라와요.' },
    { ic: '😴', lbl: '잠 챙기기',       sub: '번아웃 주의',
      detail: '책임감으로 무리하기 쉬운 달이에요. 잠 줄이면서 일하는 건 절대 X. 잠이 곧 다음 날 신뢰의 자본이에요. 1시간에 한 번 5분 스트레칭, 7시간 수면 룰을 지켜주세요.' },
  ],
  편관: [
    { ic: '⚡', lbl: '정면 돌파',       sub: '한 가지씩 처리',
      detail: '쌓인 과제·미룬 일을 한 가지씩 정면 돌파해주세요. 편관의 달은 도망치면 압박이 더 커지는 시기예요. 끝나고 나면 "내가 저걸 했네?" 싶은 뿌듯함이 와요.' },
    { ic: '🏦', lbl: '비상금 확인',     sub: '갑작스러운 지출',
      detail: '통장 잔고와 신용카드 한도를 한 번 점검해주세요. 편관 달은 보험·수리·경조사 같은 갑작스러운 지출이 들어올 수 있어요. 미루지 말고 빠르게 처리하면 더 큰 문제는 안 돼요.' },
    { ic: '🌿', lbl: '회복 시간',       sub: '잠·산책 필수',
      detail: '에너지 소진이 큰 달이라 충분한 잠·산책·따뜻한 차로 회복 시간을 챙겨주세요. 카페인·자극적인 음식은 줄이고 부드러운 음식 위주로 가주세요. 강한 운동보단 산책·요가가 어울려요.' },
  ],
  정인: [
    { ic: '📚', lbl: '강의·책',         sub: '자기계발 투자',
      detail: '관심 있던 강의·책·세미나에 결제해도 좋은 달이에요. 정인의 달은 자기계발 투자가 운으로 돌아오는 시기라 배운 만큼 다음 분기 수익으로 와요. 단 무리한 결제는 X — 진짜 필요한 한두 개만 골라주세요.' },
    { ic: '☕', lbl: '멘토 만나기',      sub: '조언 한 마디',
      detail: '선배·멘토·전문가에게 차 한 잔 청해서 조언을 구해보세요. 정인의 달은 "이거 어떻게 하셨어요?" 질문 한 번이 한 시간 시행착오를 줄여줘요. 작은 만남이 큰 길을 열어요.' },
    { ic: '📝', lbl: '메모 정리',       sub: '내면 다지기',
      detail: '쌓인 메모·아이디어·생각을 한 번 정리해보세요. 정인의 달은 큰 도약보단 내공 쌓기에 집중하기 좋은 시기예요. 조용히 정리하는 시간이 다음 큰 도약의 연료가 돼요.' },
  ],
  편인: [
    { ic: '🌙', lbl: '직관 따라가기',    sub: '느낌 좋은 곳',
      detail: '"왠지 이쪽이 끌려" 같은 느낌을 한 번 따라가보세요. 편인의 달은 분석·논리보단 직관이 더 정확한 시기예요. 단 큰 돈·계약 결정은 X — 작은 선택만 직관으로 가주세요.' },
    { ic: '⏸️', lbl: '큰 결정 미루기',  sub: '일주일 뒤 다시',
      detail: '투자·계약·이직 같은 큰 결정은 일단 일주일 미뤄주세요. 편인 달은 직관은 강하지만 분석은 약해지기 쉬워 큰 돈을 베팅하면 위험해요. 일주일 뒤에도 좋아 보이면 그때 결정하는 게 안전해요.' },
    { ic: '🎨', lbl: '창작·기획',       sub: '아이디어 메모',
      detail: '글·그림·기획·연구 같은 창작 작업에 좋은 달이에요. 자유로운 시간을 확보해서 진짜 좋은 아이디어 하나만 메모해도 그게 한 달 자산이 돼요. 반복 업무는 한 번 더 검토해주세요.' },
  ],
};

export type MonthForecast = {
  /** YYYY-MM */
  ym: string;
  /** 이번 달 점수 */
  monthScore: number;
  mood: string;
  tagline: string;
  /** 한 달 흐름 풀이 (3~4줄) */
  monthBody: string;
  /** 4분야 점수 + 한 줄 (총운·일·연애·돈) */
  fields: Array<{ ic: string; lbl: string; score: number; color: string; oneLine: string }>;
  /** 이번 달 좋은 날 1개 */
  bestDay: { day: number; score: number; hint: string };
  /** 이번 달 주의할 날 1개 */
  worstDay: { day: number; score: number; hint: string };
  /** 키워드 3개 */
  keywords: [string, string, string];
  /** 행동 가이드 3개 (펼치면 detail) */
  actions: Array<{ ic: string; lbl: string; sub: string; detail: string }>;
};

function fieldOneLine(field: 'overall' | 'work' | 'love' | 'money', score: number): string {
  const tier = score >= 85 ? 'high' : score >= 75 ? 'mid' : score >= 65 ? 'low' : 'warn';
  if (field === 'overall') {
    return tier === 'high' ? '활기 있는 흐름' : tier === 'mid' ? '안정적 흐름' : tier === 'low' ? '평이한 흐름' : '주의가 필요해요';
  }
  if (field === 'work') {
    return tier === 'high' ? '성과·인정 상승' : tier === 'mid' ? '꾸준히 쌓는 시기' : tier === 'low' ? '내실 다지기' : '번아웃 주의';
  }
  if (field === 'love') {
    return tier === 'high' ? '강한 인연 신호' : tier === 'mid' ? '안정적 케미' : tier === 'low' ? '담담한 흐름' : '오해 주의';
  }
  return tier === 'high' ? '수입 흐름 상승' : tier === 'mid' ? '안정' : tier === 'low' ? '평이' : '큰 지출 주의';
}

export function monthForecast(myeongsik: Myeongsik, today: Date = new Date()): MonthForecast | null {
  const myIlgan = myeongsik.ilgan.c;
  if (!isStem(myIlgan)) return null;
  const seed = myeongsikSeed(myeongsik);

  const y = today.getFullYear();
  const mo = today.getMonth() + 1;
  const ym = `${y}-${String(mo).padStart(2, '0')}`;

  // 이번 달 월주 천간 → 십성
  const r = calculateSaju(y, mo, 15, 12, 0, { applyTimeCorrection: false });
  const monthStem = r.monthPillarHanja[0];
  const sipsung: Sipsung = isStem(monthStem) ? getSipsung(myIlgan, monthStem) : '식신';
  const base = SCORE[sipsung];
  const adjust = (key: string, v: number) =>
    Math.max(50, Math.min(98, v + variance(seed, `${ym}_${key}`, 3)));

  const overall = adjust('overall', base.overall);
  const work    = adjust('work',    base.work);
  const love    = adjust('love',    base.love);
  const money   = adjust('money',   base.money);

  // 이번 달 일자별 일진 천간 → 점수
  const daysInMonth = new Date(y, mo, 0).getDate();
  const daily: Array<{ day: number; score: number }> = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dr = calculateSaju(y, mo, d, 12, 0, { applyTimeCorrection: false });
    const ds = dr.dayPillarHanja[0];
    const sip = isStem(ds) ? getSipsung(myIlgan, ds) : null;
    const sc = sip ? SCORE[sip].overall : 70;
    const adj = Math.max(50, Math.min(98, sc + variance(seed, `${ym}_d${d}`, 3)));
    daily.push({ day: d, score: adj });
  }

  // 오늘 이후 (오늘 포함) 중 best/worst — 미래만 의미 있음
  const todayDay = today.getDate();
  const future = daily.filter((x) => x.day >= todayDay);
  const pool = future.length > 0 ? future : daily;
  const best = pool.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = pool.reduce((a, b) => (b.score < a.score ? b : a));

  return {
    ym,
    monthScore: overall,
    mood: MOOD[sipsung],
    tagline: TAGLINE[sipsung],
    monthBody: `${MONTH_BODY[sipsung]} ${profileHint(myeongsik, 'month')}`,
    fields: [
      { ic: '☁️', lbl: '총운',     score: overall, color: '#9D7BFF', oneLine: fieldOneLine('overall', overall) },
      { ic: '💼', lbl: '일·커리어', score: work,    color: '#5B8DEF', oneLine: fieldOneLine('work',    work)    },
      { ic: '💞', lbl: '연애',      score: love,    color: '#F495C9', oneLine: fieldOneLine('love',    love)    },
      { ic: '💰', lbl: '재물',      score: money,   color: '#3DC795', oneLine: fieldOneLine('money',   money)   },
    ],
    bestDay: {
      day: best.day,
      score: best.score,
      hint: best.score >= 85 ? '큰 일 시도해도 OK' : '컨디션이 좋은 날',
    },
    worstDay: {
      day: worst.day,
      score: worst.score,
      hint: worst.score < 65 ? '중요 결정 피해주세요' : '평소처럼 차분히',
    },
    keywords: KEYWORDS[sipsung],
    actions: rotateBySeed(seed, `${ym}_d${today.getDate()}_actions`, MONTH_ACTIONS[sipsung], 3),
  };
}
