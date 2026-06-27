import { OHAENG, type OhaengKey } from '../components/ie';
import type { Myeongsik } from './saju';
import { getSipsung, type Sipsung } from './sipsung';
import { OHAENG_KR, OHAENG_PULIE } from './saju';

/** 오행 분포 바 데이터 한 항목 */
export type OhaengBar = {
  key: OhaengKey;
  kr: string;   // 목·화·토·금·수
  pulie: string; // 나무·불·흙·쇠·물
  count: number;
  percent: number; // 0-100 (count / total * 100)
  color: string;
};

/** 신강신약 섹션 데이터 */
export type ShinkangSection = {
  label: string;
  gauge: number;
  body: string;
  yongshinChip: string; // "보완 오행 · 나무(목)"
  yongshinReason: string;
};

/** 직업/적성 가이드 항목 */
export type CareerItem = {
  ic: string;
  lbl: string;    // 방향 이름
  sub: string;    // 키워드 요약
  detail: string; // 이유 설명
};

/** 밸런스 진단 */
export type BalanceDiagnosis = {
  band: 'balanced' | 'tilted' | 'extreme';
  label: string;   // "균형형" | "편중형" | "극단형"
  chip: string;    // StatPill용 짧은 레이블
  advice: string;  // 1-2줄 맞춤 조언
};

export type PersonalityCard = {
  title: string;
  subtitle: string;
  identity: string;
  strengths: string[];
  misunderstood: string[];
  comfortZone: string[];
  patterns: string[];
  goodMatches: string[];
  difficultMatches: string[];
  talkTips: string[];
  todayRoutines: string[];
  mantra: string;
  /** 오행 분포 시각화 데이터 */
  ohaengBars: OhaengBar[];
  /** 오행 분포 코멘트 — 강한 기운 + 약한/없는 기운 1줄씩 */
  ohaengComment: { strongest: string; weakest: string };
  /** 신강신약 섹션 */
  shinkangSection: ShinkangSection;
  /** 직업/적성 가이드 */
  careerItems: CareerItem[];
  /** 밸런스 진단 */
  balanceDiagnosis: BalanceDiagnosis;
};

type StemKey = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

type StemCopy = Omit<PersonalityCard, 'title' | 'subtitle' | 'talkTips' | 'todayRoutines' | 'ohaengBars' | 'ohaengComment' | 'shinkangSection' | 'careerItems' | 'balanceDiagnosis'>;

const STEM_COPY: Record<StemKey, StemCopy> = {
  甲: {
    identity: '크게 자라는 나무처럼, 방향이 잡히면 오래 밀고 가는 사람이에요.',
    strengths: ['시작을 만드는 추진력', '사람을 묶는 큰 그림', '위기 때 기준을 지키는 힘'],
    misunderstood: ['고집이 세 보인다는 말을 듣지만, 사실은 기준이 분명한 편이에요.'],
    comfortZone: ['목표가 선명한 팀', '장기 프로젝트', '신뢰를 주고받는 관계'],
    patterns: ['처음엔 빠르고 강하게, 중반엔 묵직하게 버티는 패턴이 반복돼요.'],
    goodMatches: ['약속을 지키는 사람', '성장 의지가 있는 사람'],
    difficultMatches: ['말 바꾸기가 잦은 사람', '기준 없이 분위기만 타는 사람'],
    mantra: '서두르기보다, 방향을 다시 맞추는 데 힘을 쓰는 게 나다워요.',
  },
  乙: {
    identity: '부드러운 풀처럼, 상황에 맞춰 살아남는 감각이 좋은 사람이에요.',
    strengths: ['유연한 적응력', '섬세한 관계 감각', '갈등을 줄이는 조율력'],
    misunderstood: ['맞춰주는 것처럼 보여도, 내 안의 취향은 꽤 분명한 편이에요.'],
    comfortZone: ['감정 소통이 되는 팀', '변화에 열린 환경', '세부를 챙기는 역할'],
    patterns: ['처음엔 관찰하고, 타이밍을 보면 정확히 움직이는 패턴이 있어요.'],
    goodMatches: ['배려가 자연스러운 사람', '감정 기복이 과하지 않은 사람'],
    difficultMatches: ['강압적으로 밀어붙이는 사람', '말보다 힘으로 해결하려는 사람'],
    mantra: '내 속도를 지키면서도, 필요한 말은 분명하게 전하는 게 나다워요.',
  },
  丙: {
    identity: '햇볕 같은 불기운으로, 주변 분위기를 밝게 바꾸는 힘이 있어요.',
    strengths: ['따뜻한 리더십', '빠른 실행력', '분위기를 살리는 에너지'],
    misunderstood: ['가벼워 보인다는 오해를 받지만, 핵심 순간엔 책임감이 강해요.'],
    comfortZone: ['활기 있는 팀', '피드백이 빠른 환경', '사람을 자주 만나는 일'],
    patterns: ['초반 몰입이 강하고, 관심이 식기 전에 변화를 주면 오래 가요.'],
    goodMatches: ['반응이 솔직한 사람', '함께 도전하는 걸 즐기는 사람'],
    difficultMatches: ['냉소가 습관인 사람', '계속 브레이크만 거는 사람'],
    mantra: '열정이 강점이지만, 마무리 한 가지를 꼭 챙기는 게 나다워요.',
  },
  丁: {
    identity: '촛불 같은 불기운으로, 작지만 오래 가는 집중력이 강한 사람이에요.',
    strengths: ['깊이 있는 몰입', '사람 마음을 읽는 감수성', '디테일 완성도'],
    misunderstood: ['조용해 보여도 내면의 기준과 열정은 뚜렷한 편이에요.'],
    comfortZone: ['혼자 정리할 시간', '감정이 안전한 관계', '완성도를 존중하는 문화'],
    patterns: ['한 번 마음이 가면 길게 책임지고, 아닌 건 빠르게 정리해요.'],
    goodMatches: ['말을 끝까지 들어주는 사람', '섬세함을 존중하는 사람'],
    difficultMatches: ['감정선을 무시하는 사람', '거친 말투를 당연하게 쓰는 사람'],
    mantra: '내 감각을 믿되, 피로 신호는 미루지 않고 쉬어가는 게 나다워요.',
  },
  戊: {
    identity: '넓은 흙처럼, 주변을 품고 버텨내는 힘이 큰 사람이에요.',
    strengths: ['안정감', '책임감', '사람들이 기대는 중심력'],
    misunderstood: ['느리다는 말을 들어도, 한번 정한 일은 끝까지 가는 타입이에요.'],
    comfortZone: ['역할이 분명한 구조', '신뢰를 쌓는 관계', '장기적으로 보는 일'],
    patterns: ['급변보다 축적형 성장에 강하고, 꾸준함으로 결과를 만들어요.'],
    goodMatches: ['약속과 시간 개념이 확실한 사람', '현실 감각이 좋은 사람'],
    difficultMatches: ['즉흥적으로 판을 흔드는 사람', '책임 회피가 잦은 사람'],
    mantra: '완벽보다 진행을 택하면 흐름이 훨씬 가벼워지는 게 나다워요.',
  },
  己: {
    identity: '기름진 밭흙처럼, 현실적인 감각으로 결과를 키워내는 사람이에요.',
    strengths: ['실무 감각', '생활 밀착형 문제 해결', '꾸준한 관리 능력'],
    misunderstood: ['소극적으로 보일 수 있지만, 실제로는 판단이 빠르고 실용적이에요.'],
    comfortZone: ['작은 개선이 반복되는 환경', '생활 루틴이 안정적인 구조', '협업이 부드러운 팀'],
    patterns: ['크게 한 번보다, 작게 여러 번 고도화하는 패턴에 강해요.'],
    goodMatches: ['디테일을 존중하는 사람', '말보다 행동이 꾸준한 사람'],
    difficultMatches: ['큰 말만 하고 실행이 없는 사람', '기초를 무시하는 사람'],
    mantra: '작은 정리 하나가 큰 여유를 만들어주는 게 나다워요.',
  },
  庚: {
    identity: '단단한 쇠처럼, 결단과 실행에서 존재감이 강한 사람이에요.',
    strengths: ['판단력', '위기 대응력', '불필요한 것을 걷어내는 힘'],
    misunderstood: ['차갑다는 오해를 받지만, 사실은 책임을 먼저 지는 편이에요.'],
    comfortZone: ['명확한 목표', '의사결정이 빠른 팀', '정직한 피드백 문화'],
    patterns: ['결정 순간엔 빠르고, 실행 단계에선 단호하게 밀어붙여요.'],
    goodMatches: ['핵심을 정확히 말하는 사람', '약속을 실천으로 보여주는 사람'],
    difficultMatches: ['우유부단한 태도가 잦은 사람', '감정으로 규칙을 흔드는 사람'],
    mantra: '정답을 고르기보다, 덜 중요한 걸 먼저 덜어내는 게 나다워요.',
  },
  辛: {
    identity: '정교한 보석 같은 쇠기운으로, 미감과 완성도 감각이 뛰어난 사람이에요.',
    strengths: ['정밀한 판단', '미적 감각', '품질을 끌어올리는 기준'],
    misunderstood: ['예민하다는 말 속에, 사실은 높은 완성도 기준이 숨어 있어요.'],
    comfortZone: ['정돈된 환경', '피드백이 세련된 팀', '완성도를 보는 일'],
    patterns: ['처음엔 신중하고, 확신이 서면 완성도 높게 끝내는 패턴이 있어요.'],
    goodMatches: ['존중 있는 소통을 하는 사람', '디테일을 함께 맞춰주는 사람'],
    difficultMatches: ['막말이 습관인 사람', '대충 넘어가자는 태도가 강한 사람'],
    mantra: '기준을 지키되, 완벽주의는 10%만 내려놓아도 충분한 게 나다워요.',
  },
  壬: {
    identity: '큰 물처럼, 시야가 넓고 변화에 강한 흐름형 사람이에요.',
    strengths: ['확장성', '정보 연결 능력', '새로운 기회를 포착하는 감각'],
    misunderstood: ['산만해 보일 수 있지만, 큰 판을 보는 집중이 강한 편이에요.'],
    comfortZone: ['자율성이 높은 환경', '탐색과 실험이 가능한 구조', '새로운 사람과의 교류'],
    patterns: ['한곳에 묶이기보다, 흐름을 타며 큰 기회를 잡는 패턴이 반복돼요.'],
    goodMatches: ['유연하게 소통하는 사람', '가능성을 함께 키우는 사람'],
    difficultMatches: ['통제만 강한 사람', '변화를 무조건 막는 사람'],
    mantra: '확장보다 정리 한 번을 더하면 성과가 또렷해지는 게 나다워요.',
  },
  癸: {
    identity: '이슬 같은 물기운으로, 조용하지만 깊게 스며드는 힘이 있는 사람이에요.',
    strengths: ['섬세한 통찰', '상대의 마음을 읽는 힘', '조용한 회복력'],
    misunderstood: ['소심해 보일 수 있지만, 중요한 순간 판단은 의외로 단단해요.'],
    comfortZone: ['정서적으로 안전한 관계', '깊이 있는 대화', '혼자 회복할 여유'],
    patterns: ['겉은 잔잔해도, 내면에서 충분히 숙성한 뒤 정확히 움직여요.'],
    goodMatches: ['경청이 되는 사람', '감정선의 결을 존중하는 사람'],
    difficultMatches: ['말로 압박하는 사람', '감정을 가볍게 소비하는 사람'],
    mantra: '내 감정의 결을 무시하지 않고, 필요한 거절을 하는 게 나다워요.',
  },
};

const OHAENG_SUPPLEMENT: Record<OhaengKey, string> = {
  wood: '목 기운을 보완하면 성장 동력이 더 또렷해져요. 산책·독서·새로운 공부가 좋아요.',
  fire: '화 기운을 보완하면 표현력이 살아나요. 햇볕, 가벼운 운동, 사람 만남이 도움 돼요.',
  earth: '토 기운을 보완하면 마음이 안정돼요. 루틴 정리, 식사 시간 고정이 좋아요.',
  metal: '금 기운을 보완하면 판단이 선명해져요. 정리정돈, 우선순위 분리가 효과적이에요.',
  water: '수 기운을 보완하면 회복력이 올라가요. 수면, 수분, 조용한 휴식이 핵심이에요.',
};

const OHAENG_STRENGTH: Record<OhaengKey, string> = {
  wood: '목 기운이 강해, 시작과 확장 에너지가 분명한 편이에요.',
  fire: '화 기운이 강해, 사람을 끌어당기는 표현력이 돋보여요.',
  earth: '토 기운이 강해, 현실 감각과 버티는 힘이 안정적이에요.',
  metal: '금 기운이 강해, 판단과 정리 능력이 큰 강점이에요.',
  water: '수 기운이 강해, 통찰과 연결 감각이 뛰어난 편이에요.',
};

const STEM_TALK_TIPS: Record<StemKey, string[]> = {
  甲: ['요점부터 먼저 말하고, 이유를 1문장 덧붙여보세요.', '결론을 밀기 전에 상대 우선순위를 먼저 물어보세요.'],
  乙: ['완곡한 표현 뒤에 원하는 바를 한 줄로 명확히 말해보세요.', '미안함보다 요청 문장을 먼저 꺼내면 오해가 줄어요.'],
  丙: ['열정 설명 전에 상대 입장을 먼저 확인해보세요.', '대화 마무리에 실행 날짜를 함께 잡아보세요.'],
  丁: ['길게 참기 전에 불편 포인트를 짧게 말해보세요.', '감정 표현 뒤에 구체 요청 1개를 꼭 붙여보세요.'],
  戊: ['설명 전에 먼저 상대 말을 끝까지 듣고 요약해보세요.', '단호한 표현 앞에 공감 문장 한 줄을 더해보세요.'],
  己: ['디테일 설명 전 핵심 결론을 먼저 말해보세요.', '도와달라는 말은 미리 타이밍을 정해 요청해보세요.'],
  庚: ['정답 제시 전에 선택지를 2개 열어두면 협업이 쉬워져요.', '피드백은 문제+대안을 함께 말해보세요.'],
  辛: ['완성도 기준을 숫자/기한으로 먼저 공유해보세요.', '지적보다 제안 문장으로 시작하면 설득력이 올라가요.'],
  壬: ['아이디어를 말할 때 우선순위를 1~2개로 좁혀보세요.', '대화 끝에 다음 액션을 문장으로 확정해보세요.'],
  癸: ['돌려 말하기보다 원하는 감정을 짧게 이름 붙여보세요.', '거절이 필요할 땐 이유보다 기준을 먼저 말해보세요.'],
};

const OHAENG_ROUTINES: Record<OhaengKey, string[]> = {
  wood: ['아침 10분 산책으로 생각을 깨워보세요.', '할 일 3개를 적고 순서대로 시작해보세요.'],
  fire: ['햇볕 보는 시간을 15분 확보해보세요.', '고마운 사람 1명에게 짧은 메시지를 보내보세요.'],
  earth: ['책상/가방 한 칸만 정리해 안정감을 만드세요.', '식사 시간을 일정하게 맞춰 컨디션을 지켜보세요.'],
  metal: ['우선순위 1·2·3만 정하고 나머지는 미뤄두세요.', '불필요한 알림 3개를 꺼서 집중 환경을 만드세요.'],
  water: ['물 한 컵을 자주 마시며 리듬을 유지하세요.', '잠들기 전 20분은 화면 없이 조용히 쉬어보세요.'],
};

/** 오행별 색상 */
const OHAENG_COLOR: Record<OhaengKey, string> = {
  wood: '#6FCF97',
  fire: '#F2994A',
  earth: '#F2C94C',
  metal: '#B0BEC5',
  water: '#56CCF2',
};

/** 십성 그룹 → 직업/적성 매핑 */
const SIPSUNG_CAREER: Record<string, CareerItem> = {
  '식신/상관': {
    ic: '🎨',
    lbl: '창작 · 표현 · 기획',
    sub: '식신 · 상관',
    detail: '자신의 생각과 감각을 표현하는 일이 강점이에요. 콘텐츠 크리에이터, 마케터, 기획자, 디자이너, 작가, 예술가처럼 아이디어를 결과물로 만드는 분야에서 두각을 나타낼 수 있어요.',
  },
  '정재/편재': {
    ic: '💼',
    lbl: '사업 · 금융 · 영업',
    sub: '정재 · 편재',
    detail: '재물을 다루고 기회를 포착하는 감각이 발달해 있어요. 사업가, 영업·세일즈, 금융·투자, 무역처럼 결과를 수치로 측정할 수 있는 분야에서 성과를 내기 좋아요.',
  },
  '정관/편관': {
    ic: '⚖️',
    lbl: '공직 · 관리 · 법',
    sub: '정관 · 편관',
    detail: '책임과 권위를 다루는 환경에서 강점이 커요. 공무원, 법조계, 군인·경찰, 관리자·임원처럼 규칙과 질서 안에서 성과를 내는 구조에 잘 맞아요.',
  },
  '정인/편인': {
    ic: '📚',
    lbl: '연구 · 교육 · 전문직',
    sub: '정인 · 편인',
    detail: '깊이 탐구하고 전달하는 능력이 뛰어나요. 교사·교수, 연구원, 의료·상담, 컨설턴트처럼 전문 지식을 쌓고 나누는 분야가 잘 맞아요.',
  },
  '비견/겁재': {
    ic: '🦅',
    lbl: '독립 · 전문직 · 스타트업',
    sub: '비견 · 겁재',
    detail: '자기 기준과 독립성이 강해 혼자서도 방향을 잡는 능력이 있어요. 프리랜서, 창업가, 스타트업, 강사·코치처럼 스스로 판을 짜는 환경에서 빠르게 성장해요.',
  },
};

/** 십성 → 그룹키 */
function sipsungToGroup(s: Sipsung): string {
  if (s === '식신' || s === '상관') return '식신/상관';
  if (s === '정재' || s === '편재') return '정재/편재';
  if (s === '정관' || s === '편관') return '정관/편관';
  if (s === '정인' || s === '편인') return '정인/편인';
  return '비견/겁재';
}

type StemKey10 = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

/** 명식에서 주요 십성 집계 후 직업/적성 카드 3개 반환 */
function buildCareerItems(m: Myeongsik): CareerItem[] {
  const ilgan = m.ilgan.c as StemKey10;
  const validStems = new Set<string>(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']);

  const groupCount: Record<string, number> = {};
  // 4기둥 천간 중 ilgan 본인 기둥(일주)은 비견으로만 나오므로 포함해도 무방하지만
  // 더 의미 있는 다양성을 위해 일주(index 2) 천간은 건너뜀
  for (let i = 0; i < m.pillars.length; i++) {
    const stem = m.pillars[i].top.c;
    if (!validStems.has(stem)) continue;
    const ss = getSipsung(ilgan, stem as StemKey10);
    const grp = sipsungToGroup(ss);
    groupCount[grp] = (groupCount[grp] ?? 0) + 1;
  }

  // 빈도 내림차순 정렬, 같으면 SIPSUNG_CAREER 키 순서 유지
  const order = ['식신/상관', '정재/편재', '정관/편관', '정인/편인', '비견/겁재'];
  const sorted = Object.entries(groupCount).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  // 상위 3개, 없으면 기본 3개
  const top3 = sorted.slice(0, 3).map(([k]) => k);
  if (top3.length < 3) {
    for (const k of order) {
      if (!top3.includes(k)) top3.push(k);
      if (top3.length === 3) break;
    }
  }
  return top3.map((k) => SIPSUNG_CAREER[k]);
}

/** 밸런스 진단 빌드 */
function buildBalanceDiagnosis(m: Myeongsik): BalanceDiagnosis {
  const band = getBalanceBand(m);
  const entries = Object.entries(m.ohaeng) as [OhaengKey, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const maxKey = sorted[0][0];
  const maxKr = OHAENG_KR[maxKey];

  const configs: Record<'balanced' | 'tilted' | 'extreme', { label: string; chip: string; advice: string }> = {
    balanced: {
      label: '균형형',
      chip: '오행 균형 · 안정',
      advice: `오행이 고르게 분포되어 있어요. 큰 기복 없이 안정적으로 힘을 발휘하는 타입이에요. 무리하지 않는 페이스로 꾸준히 나아가는 게 최고의 전략이에요.`,
    },
    tilted: {
      label: '편중형',
      chip: `${maxKr} 기운 편중`,
      advice: `${OHAENG_KR[maxKey]}(${OHAENG_PULIE[maxKey]}) 기운이 두드러지는 편중형이에요. 잘 맞는 분야에서 빠르게 성과를 내는 대신, 에너지 소진도 빠를 수 있어요. 규칙적인 휴식 루틴을 함께 잡으면 오래 갈 수 있어요.`,
    },
    extreme: {
      label: '극단형',
      chip: `${maxKr} 기운 강세`,
      advice: `${OHAENG_KR[maxKey]}(${OHAENG_PULIE[maxKey]}) 기운이 매우 강한 극단형이에요. 자신과 맞는 판에서는 강력한 존재감을 드러내요. 과열 구간을 스스로 인식하고 쉬어가는 타이밍을 놓치지 않는 게 핵심이에요.`,
    },
  };

  return { band, ...configs[band] };
}

function getVariantIndex(m: Myeongsik, mod: number): number {
  const seed = m.pillars.map((p) => `${p.top.c}${p.bot.c}`).join('');
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function getBalanceBand(m: Myeongsik): 'balanced' | 'tilted' | 'extreme' {
  const values = Object.values(m.ohaeng);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const gap = max - min;
  if (gap >= 4) return 'extreme';
  if (gap >= 2) return 'tilted';
  return 'balanced';
}

function buildIdentityTail(m: Myeongsik, maxOhaeng: OhaengKey): string {
  const hourBranch = m.pillars[3]?.bot?.c ?? '';
  const dayBranch = m.pillars[2]?.bot?.c ?? '';
  const band = getBalanceBand(m);

  const byBand: Record<'balanced' | 'tilted' | 'extreme', string[]> = {
    balanced: ['기본 밸런스가 좋아서, 무리하지 않으면 안정적으로 성과를 만들 수 있어요.', '기복이 크지 않아 꾸준함이 강점으로 이어지기 쉬워요.'],
    tilted: ['강한 기운이 분명해서, 잘 맞는 일에 들어가면 속도가 빠르게 붙어요.', '에너지 편중이 있는 편이라, 휴식 루틴을 함께 잡으면 훨씬 오래 갑니다.'],
    extreme: ['강점이 아주 선명한 타입이라, 맞는 판에서는 존재감이 크게 살아나요.', '몰입할 때 폭발력이 큰 만큼, 과열 구간만 관리하면 성과가 더 안정적이에요.'],
  };

  const byHour: Record<string, string> = {
    子: '야간 집중력이 좋아, 조용한 환경에서 판단이 또렷해지는 편이에요.',
    丑: '급하게 흔들리기보다 천천히 확인하고 가는 쪽이 성과가 좋아요.',
    寅: '시작 에너지가 좋아 초반 스타트를 잘 끊는 편이에요.',
    卯: '사람과의 호흡을 빠르게 읽고 맞추는 감각이 강한 편이에요.',
    辰: '현실 점검이 빨라서 계획을 실행 가능한 형태로 바꾸는 능력이 좋아요.',
    巳: '상황 판단이 빨라 변화 구간에서 대응력이 좋은 편이에요.',
    午: '표현력과 추진력이 같이 올라와 사람을 움직이는 힘이 있어요.',
    未: '디테일 정리력이 좋아 결과물 완성도를 높이는 데 강점이 있어요.',
    申: '핵심을 빠르게 분리해 우선순위를 잡는 능력이 좋아요.',
    酉: '기준을 세밀하게 보는 편이라 품질 관리에서 강점을 보여요.',
    戌: '책임 구간에서 버티는 힘이 좋아 중반 이후 성과가 단단해져요.',
    亥: '직관이 살아나는 편이라 큰 방향을 잡을 때 감각이 좋은 편이에요.',
  };

  const byMax: Record<OhaengKey, string> = {
    wood: '성장 축을 잡고 넓혀가는 전략이 특히 잘 맞아요.',
    fire: '표현과 연결을 살리는 방식으로 운을 키우기 좋아요.',
    earth: '정리와 축적을 기반으로 결과를 만드는 방식이 잘 맞아요.',
    metal: '기준을 세우고 줄이는 의사결정에서 강점이 큽니다.',
    water: '탐색과 흐름 파악을 통해 기회를 연결하는 감각이 좋아요.',
  };

  const v = getVariantIndex(m, 2);
  const bandLine = byBand[band][v];
  const hourLine = byHour[hourBranch] ?? byHour[dayBranch] ?? '내 리듬을 지킬수록 판단의 정확도가 올라가는 편이에요.';
  return `${bandLine} ${hourLine} ${byMax[maxOhaeng]}`;
}

export function personalityCard(myeongsik: Myeongsik): PersonalityCard {
  const ilgan = myeongsik.ilgan.c as StemKey;
  const base = STEM_COPY[ilgan] ?? STEM_COPY.甲;

  const entries = Object.entries(myeongsik.ohaeng) as [OhaengKey, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const maxOhaeng = sorted[0][0];
  const missing = entries.filter(([, n]) => n === 0).map(([k]) => k);

  const strengths = [OHAENG_STRENGTH[maxOhaeng], ...base.strengths].slice(0, 3);
  const comfortZone = [...base.comfortZone];

  if (missing.length > 0) {
    comfortZone.push(OHAENG_SUPPLEMENT[missing[0]]);
  } else {
    comfortZone.push('오행이 고르게 분포된 편이라, 큰 무리 없이 균형을 잡는 감각이 좋아요.');
  }

  const hourBranch = myeongsik.pillars[3]?.bot?.c ?? '';
  const dayBranch = myeongsik.pillars[2]?.bot?.c ?? '';
  const variant = getVariantIndex(myeongsik, 3);
  const relationTipByHour: Record<string, string> = {
    子: '감정이 올라오는 대화는 밤보다 낮 시간에 정리해보세요.',
    丑: '결론을 급히 내리기보다 확인 질문을 한 번 더 해보세요.',
    寅: '시작은 빠르되, 상대 합의 문장을 한 줄 남겨두세요.',
    卯: '관계가 부드러워도 경계선은 말로 분명히 해두세요.',
    辰: '약속은 일정·기한까지 숫자로 맞추면 갈등이 줄어요.',
    巳: '좋은 아이디어도 실행 순서를 먼저 정하면 훨씬 편해져요.',
    午: '감정이 뜨거운 날엔 단정 표현 대신 제안형 문장으로 말해보세요.',
    未: '완성도 집착이 올라오면, 80% 선에서 먼저 공유해보세요.',
    申: '효율을 중시하더라도 상대 감정 확인 한 줄을 붙여보세요.',
    酉: '기준 설명은 길게 말하기보다 핵심 2줄로 전해보세요.',
    戌: '책임감이 과해질 때는 역할 분담을 먼저 요청해보세요.',
    亥: '직감이 맞아도 중요한 약속은 문자로 다시 확인해두세요.',
  };

  const mismatchTail = relationTipByHour[hourBranch] ?? relationTipByHour[dayBranch] ?? '기대치를 먼저 맞추는 대화가 관계 소모를 줄여줘요.';

  const strengthenedPatterns = [...base.patterns, variant === 0
    ? '한 번 정한 기준은 쉽게 바꾸지 않아, 신뢰를 쌓을수록 강점이 커져요.'
    : variant === 1
      ? '중요한 결정은 빠르고, 사소한 부분은 반복 점검하는 흐름이 나타나요.'
      : '초반 탐색 후 확신 구간에서 속도가 붙는 패턴이 자주 보입니다.'
  ].slice(0, 2);

  const enhancedDifficult = [mismatchTail, ...base.difficultMatches].slice(0, 2);
  const enhancedMantra = `${base.mantra} ${variant === 0 ? '작은 약속 1개를 끝까지 지켜보세요.' : variant === 1 ? '중요한 일은 시작 시간을 먼저 고정해보세요.' : '마무리 체크 1번이 습관이에요.'}`;

  // ── 오행 분포 바 ──────────────────────────────────────────
  const ohaengOrder: OhaengKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  const total = Object.values(myeongsik.ohaeng).reduce((s, n) => s + n, 0) || 1;
  const ohaengBars: OhaengBar[] = ohaengOrder.map((key) => ({
    key,
    kr: OHAENG_KR[key],
    pulie: OHAENG_PULIE[key],
    count: myeongsik.ohaeng[key],
    percent: Math.round((myeongsik.ohaeng[key] / total) * 100),
    color: OHAENG_COLOR[key],
  }));

  const weakestMissing = missing[0];
  const weakestKey = weakestMissing ?? sorted[sorted.length - 1][0];
  const ohaengComment = {
    strongest: OHAENG_STRENGTH[maxOhaeng],
    weakest: weakestMissing
      ? `${OHAENG_KR[weakestKey]}(${OHAENG_PULIE[weakestKey]}) 기운이 없어요. ${OHAENG_SUPPLEMENT[weakestKey]}`
      : `${OHAENG_KR[weakestKey]}(${OHAENG_PULIE[weakestKey]}) 기운이 가장 적어요. ${OHAENG_SUPPLEMENT[weakestKey]}`,
  };

  // ── 신강신약 섹션 ─────────────────────────────────────────
  const sk = myeongsik.shinkang;
  const shinkangSection: ShinkangSection = {
    label: sk.label,
    gauge: sk.gauge,
    body: sk.body,
    yongshinChip: `보완 오행 · ${sk.yongshin.pulie}(${sk.yongshin.kr})`,
    yongshinReason: sk.yongshinReason,
  };

  // ── 직업/적성 ─────────────────────────────────────────────
  const careerItems = buildCareerItems(myeongsik);

  // ── 밸런스 진단 ───────────────────────────────────────────
  const balanceDiagnosis = buildBalanceDiagnosis(myeongsik);

  return {
    title: '나의 사주 성격 카드',
    subtitle: `${OHAENG[myeongsik.ilgan.ohaeng].label} 기운 기준 성향 요약`,
    identity: `${base.identity} ${buildIdentityTail(myeongsik, maxOhaeng)}`,
    strengths,
    misunderstood: base.misunderstood,
    comfortZone: comfortZone.slice(0, 3),
    patterns: strengthenedPatterns,
    goodMatches: base.goodMatches,
    difficultMatches: enhancedDifficult,
    talkTips: STEM_TALK_TIPS[ilgan] ?? STEM_TALK_TIPS.甲,
    todayRoutines: OHAENG_ROUTINES[maxOhaeng],
    mantra: enhancedMantra,
    ohaengBars,
    ohaengComment,
    shinkangSection,
    careerItems,
    balanceDiagnosis,
  };
}
