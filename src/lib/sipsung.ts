/**
 * 십성(十星) 룰베이스 — 사주 명리 표준 10관계 결정론.
 *
 * 일간 천간(나) × 비교 천간 → 십성:
 *   같은 오행 + 같은 음양 = 비견 (比肩) — 동료, 친구
 *   같은 오행 + 다른 음양 = 겁재 (劫財) — 경쟁, 형제
 *   내가 생함 + 같은 음양 = 식신 (食神) — 표현, 즐거움
 *   내가 생함 + 다른 음양 = 상관 (傷官) — 창의, 자유
 *   내가 극함 + 다른 음양 = 정재 (正財) — 안정 재물
 *   내가 극함 + 같은 음양 = 편재 (偏財) — 동적 재물
 *   나를 극함 + 다른 음양 = 정관 (正官) — 책임, 명예
 *   나를 극함 + 같은 음양 = 편관 (偏官) — 압박, 결단
 *   나를 생함 + 다른 음양 = 정인 (正印) — 학습, 보호
 *   나를 생함 + 같은 음양 = 편인 (偏印) — 직관, 영감
 */

export type Sipsung =
  | '비견' | '겁재'
  | '식신' | '상관'
  | '정재' | '편재'
  | '정관' | '편관'
  | '정인' | '편인';

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
type OhaengKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
type Eumyang = 'yang' | 'yin';

const STEM_INFO: Record<Stem, { ohaeng: OhaengKey; ym: Eumyang }> = {
  甲: { ohaeng: 'wood',  ym: 'yang' },
  乙: { ohaeng: 'wood',  ym: 'yin'  },
  丙: { ohaeng: 'fire',  ym: 'yang' },
  丁: { ohaeng: 'fire',  ym: 'yin'  },
  戊: { ohaeng: 'earth', ym: 'yang' },
  己: { ohaeng: 'earth', ym: 'yin'  },
  庚: { ohaeng: 'metal', ym: 'yang' },
  辛: { ohaeng: 'metal', ym: 'yin'  },
  壬: { ohaeng: 'water', ym: 'yang' },
  癸: { ohaeng: 'water', ym: 'yin'  },
};

/** 오행 상생 (내가 생하는 오행) — 木→火→土→金→水→木 */
const SAENG: Record<OhaengKey, OhaengKey> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
/** 오행 상극 (내가 극하는 오행) — 木→土→水→火→金→木 */
const KEUK: Record<OhaengKey, OhaengKey> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};

/** 일간 vs 비교 천간 → 십성 */
export function getSipsung(ilgan: Stem, target: Stem): Sipsung {
  const me = STEM_INFO[ilgan];
  const t = STEM_INFO[target];
  const sameYM = me.ym === t.ym;

  // 같은 오행
  if (me.ohaeng === t.ohaeng) return sameYM ? '비견' : '겁재';
  // 내가 생함 (식신/상관)
  if (SAENG[me.ohaeng] === t.ohaeng) return sameYM ? '식신' : '상관';
  // 내가 극함 (편재/정재)
  if (KEUK[me.ohaeng] === t.ohaeng) return sameYM ? '편재' : '정재';
  // 나를 극함 (편관/정관)
  if (KEUK[t.ohaeng] === me.ohaeng) return sameYM ? '편관' : '정관';
  // 나를 생함 (편인/정인)
  return sameYM ? '편인' : '정인';
}

export type DailyFortune = {
  sipsung: Sipsung;
  /** 한 줄 메인 카피 (히어로) */
  mood: string;
  oneLine: string;
  /** 5섹션 — 총운·연애·재물·직장·건강 */
  sections: {
    overall: { score: number; body: string };
    love:    { score: number; body: string };
    money:   { score: number; body: string };
    work:    { score: number; body: string };
    health:  { score: number; body: string };
  };
  /** 럭키 칩 */
  hashtags: [string, string, string];
};

/**
 * 십성별 5섹션 점수·텍스트 베이스.
 * 추후 LLM 합성으로 교체 가능 (Phase 2).
 */
const FORTUNE_BY_SIPSUNG: Record<Sipsung, DailyFortune> = {
  비견: {
    sipsung: '비견',
    mood: '동료의 날',
    oneLine: '오늘은 친구·동료와 함께하면 힘이 솟아. 혼자 끌어안지 말기 ☁️',
    sections: {
      overall: { score: 72, body: '안정적인 흐름. 큰 변화보다 다지는 하루.' },
      love:    { score: 68, body: '편안한 사이일수록 마음 표현 한 번 더. 의외의 인연은 친구의 친구로부터.' },
      money:   { score: 65, body: '큰 지출보다 N빵·공동 구매 같은 분담이 어울리는 날.' },
      work:    { score: 78, body: '협업·팀워크 강한 날. 동료 한 명이 결정적 도움이 될 수 있어.' },
      health:  { score: 70, body: '함께 운동·산책. 혼자보단 같이 움직일 때 더 회복돼.' },
    },
    hashtags: ['#동료의날', '#함께해', '#팀워크'],
  },
  겁재: {
    sipsung: '겁재',
    mood: '경쟁 모드',
    oneLine: '경쟁 에너지 강한 날. 너무 자르거나 잡지 말고, 흐름에 맡기는 것도 OK 🔥',
    sections: {
      overall: { score: 65, body: '추진력은 ↑, 단 충돌도 가능. 한 박자 쉬어가는 호흡이 도움.' },
      love:    { score: 60, body: '경쟁심·질투 주의. 솔직한 대화가 답.' },
      money:   { score: 58, body: '큰 지출·충동 결제 주의. 지갑은 집에 두고 다니세요 진짜로요ㅋㅋ' },
      work:    { score: 72, body: '경쟁자가 있을수록 빛나는 날. 단 독선은 X.' },
      health:  { score: 70, body: '에너지 ↑. 단 무리하면 다음날 후폭풍.' },
    },
    hashtags: ['#경쟁모드', '#추진력UP', '#한박자쉬기'],
  },
  식신: {
    sipsung: '식신',
    mood: '표현의 날',
    oneLine: '오늘은 마음 가는 대로 표현해도 다 정답. 자연스러운 너가 가장 매력 ✨',
    sections: {
      overall: { score: 84, body: '흐름이 부드럽고 즐거운 일이 많을 날. 마음 가는 대로 OK.' },
      love:    { score: 88, body: '평소 안 입던 옷 한 번. 표현력·매력 ↑ 인연이 알아봐줘.' },
      money:   { score: 76, body: '소소한 보상이 들어오는 흐름. 점심값 N빵 어디 갔지? 한번 확인해봐.' },
      work:    { score: 80, body: '아이디어·프레젠테이션 좋은 날. 너의 말이 잘 통해.' },
      health:  { score: 82, body: '컨디션 좋음. 좋아하는 음식·취미로 충전.' },
    },
    hashtags: ['#표현의날', '#럭키비키', '#마음가는대로'],
  },
  상관: {
    sipsung: '상관',
    mood: '창의의 날',
    oneLine: '틀을 깨는 발상이 빛나는 날. 단, 사람한테 너무 직설적이면 가시 돼 😎',
    sections: {
      overall: { score: 78, body: '창의력 ↑. 단 비판·풍자는 살짝 톤다운.' },
      love:    { score: 72, body: '재치·유머가 매력 포인트. 단 상대 약점 건드리는 농담은 X.' },
      money:   { score: 70, body: '새로운 아이디어로 돈 들어올 흐름. 부업·사이드 검토 OK.' },
      work:    { score: 84, body: '관습 깨는 제안 채택될 가능성. 자유로운 환경에서 폭발.' },
      health:  { score: 75, body: '머리 쓰는 일 많아. 충분한 수면·물.' },
    },
    hashtags: ['#창의의날', '#아이디어폭발', '#톤다운'],
  },
  정재: {
    sipsung: '정재',
    mood: '안정 흐름',
    oneLine: '꾸준히 모이는 날. 작은 보상이 차곡차곡 ☁️',
    sections: {
      overall: { score: 80, body: '안정적이고 단단한 흐름. 계획대로 진행 OK.' },
      love:    { score: 76, body: '오래 갈 인연 신호. 진중하게 다가가면 좋은 결과.' },
      money:   { score: 88, body: '꾸준한 수입·작은 보상 ↑. 적금·예금 점검하기 좋은 날.' },
      work:    { score: 78, body: '맡은 일에 집중. 결과물 인정받을 흐름.' },
      health:  { score: 75, body: '루틴 유지. 무리한 다이어트보단 꾸준한 식단.' },
    },
    hashtags: ['#안정흐름', '#차곡차곡', '#적금점검'],
  },
  편재: {
    sipsung: '편재',
    mood: '기회의 날',
    oneLine: '예상 못한 곳에서 돈·기회가 들어올 흐름. 안테나 켜두기 💰',
    sections: {
      overall: { score: 82, body: '의외의 만남·정보·돈. 호기심 가는 데로 가봐.' },
      love:    { score: 78, body: '새로운 인연 만날 자리. 사람 많은 곳·모임 추천.' },
      money:   { score: 90, body: '횡재·부수입 신호. 단 큰 투자는 검증 후.' },
      work:    { score: 75, body: '거래·영업·외부 미팅 좋은 날. 외근 강추.' },
      health:  { score: 72, body: '에너지 ↑이지만 외부 활동 많아 쉽게 지칠 수 있어.' },
    },
    hashtags: ['#기회의날', '#횡재신호', '#안테나ON'],
  },
  정관: {
    sipsung: '정관',
    mood: '책임의 날',
    oneLine: '책임감·신뢰가 빛나는 날. 윗사람·고객의 인정 받을 흐름 💼',
    sections: {
      overall: { score: 75, body: '안정·책임 키워드. 약속·일정 잘 지키는 게 운 ↑.' },
      love:    { score: 78, body: '진중한 만남·결혼 화제 자연. 가벼운 농담보단 진심.' },
      money:   { score: 72, body: '꾸준한 수입. 새 투자보단 기존 자산 정리.' },
      work:    { score: 88, body: '윗사람·고객 인정 받는 날. 정공법 OK.' },
      health:  { score: 70, body: '책임감에 무리. 어깨·허리 스트레칭 챙기기.' },
    },
    hashtags: ['#책임의날', '#신뢰UP', '#정공법'],
  },
  편관: {
    sipsung: '편관',
    mood: '도전의 날',
    oneLine: '압박·과제 많지만 정면 돌파하면 한 단계 성장하는 날 ⚡',
    sections: {
      overall: { score: 68, body: '과제·스트레스 ↑. 단 잘 넘기면 큰 성장.' },
      love:    { score: 65, body: '갈등·다툼 주의. 한 박자 쉬어가는 호흡.' },
      money:   { score: 65, body: '큰 지출·갑작스러운 돈 들어갈 일. 비상금 확인.' },
      work:    { score: 78, body: '도전적 과제·시험·발표 좋은 날. 정면 돌파 OK.' },
      health:  { score: 60, body: '에너지 소진 큰 날. 스트레스 관리·충분한 휴식.' },
    },
    hashtags: ['#도전의날', '#정면돌파', '#비상금확인'],
  },
  정인: {
    sipsung: '정인',
    mood: '배움의 날',
    oneLine: '배우고 채우는 날. 책·강의·멘토 만나기 좋아 📚',
    sections: {
      overall: { score: 78, body: '내면 정리·학습에 좋은 날. 큰 결정보단 다지기.' },
      love:    { score: 72, body: '깊은 대화·정신적 교감 ↑. 외모보단 마음.' },
      money:   { score: 70, body: '큰 수입보단 자기계발 투자. 강의·책 결제 OK.' },
      work:    { score: 75, body: '배우는 자리·자료 조사 좋은 날.' },
      health:  { score: 80, body: '컨디션 안정. 충분한 수면·정신 건강 케어.' },
    },
    hashtags: ['#배움의날', '#멘토만나기', '#정신케어'],
  },
  편인: {
    sipsung: '편인',
    mood: '직관의 날',
    oneLine: '직관·영감이 살아나는 날. 평소 안 하던 선택이 정답일 수도 🌙',
    sections: {
      overall: { score: 72, body: '직관 ↑. 단 분석·논리는 평소보다 약함.' },
      love:    { score: 75, body: '미스터리한 매력 ↑. 평범한 만남보단 특별한 자리.' },
      money:   { score: 65, body: '예측 불가 흐름. 큰 결정 미루기.' },
      work:    { score: 72, body: '창작·기획·연구 좋은 날. 반복 업무는 살짝 지루.' },
      health:  { score: 70, body: '예민·잠 못 이룸 주의. 명상·산책으로 정리.' },
    },
    hashtags: ['#직관의날', '#영감폭발', '#큰결정미루기'],
  },
};

/** 일간 + 비교 일간(예: 오늘 일진 천간) → DailyFortune */
export function fortuneBySipsung(ilgan: Stem, dayStem: Stem): DailyFortune {
  const sipsung = getSipsung(ilgan, dayStem);
  return FORTUNE_BY_SIPSUNG[sipsung];
}
