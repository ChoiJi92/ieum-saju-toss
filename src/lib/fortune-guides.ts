import { pickBySeed, rotateBySeed } from './personalize';

export type TodayGuideSection = {
  id: string;
  label: string;
  score: number;
};

export type TodayActionGuide = {
  doList: string[];
  avoidList: string[];
  luckyTime: string;
  todayOneLine: string;
  todayNoNo: string;
  missions: { morning: string; noon: string; night: string };
  closingQuestion: string;
  tomorrowKickoff: string;
};

export type MonthPlanField = {
  lbl: string;
  score: number;
};

export type MonthActionPlan = {
  topLabel: string;
  lowLabel: string;
  missions: { start: string; keep: string; finish: string };
  caution: string;
  monthClosing: string;
  weekFocus: string[];
  monthlyChecklist: string[];
  scoreCommentary: string[];
  weeklyRhythm: string[];
};

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function scopedSeed(parts: Array<string | number | undefined | null>): string {
  return parts.filter((x) => x !== undefined && x !== null && x !== '').join('|');
}

const DO_MAP: Record<string, string[]> = {
  overall: [
    '오늘 가장 중요한 1가지를 아침에 먼저 끝내보세요.',
    '해야 할 일 3개만 남기고 나머지는 과감히 미뤄도 괜찮아요.',
    '오늘의 기준을 한 문장으로 적고 그 기준에 맞는 일부터 처리하세요.',
    '오전에는 시작, 오후에는 정리처럼 하루 역할을 나눠보세요.',
  ],
  love: [
    '고마운 사람에게 짧은 안부를 먼저 보내보세요.',
    '표현을 아끼기보다 짧게라도 진심을 말해보세요.',
    '대화할 때 결론보다 상대 감정을 먼저 한 번 받아주세요.',
    '오늘 떠오른 사람에게 부담 없는 한 줄을 남겨보세요.',
  ],
  money: [
    '오늘 결제 전 10초 멈춤 규칙을 써보세요.',
    '자동이체·구독 1개만 점검해도 흐름이 좋아져요.',
    '작은 환급·포인트·캐시백을 하나만 확인해보세요.',
    '오늘 쓸 금액 상한선을 숫자로 먼저 정하고 움직이세요.',
  ],
  work: [
    '가장 어려운 업무를 오전에 먼저 처리해보세요.',
    '회의 전 핵심 2줄만 미리 정리해두면 훨씬 수월해져요.',
    '중요한 대화 전 목적·요청·마감일을 한 줄씩 적어보세요.',
    '오늘은 결과물 하나를 작게라도 보이게 만드는 쪽이 유리해요.',
  ],
  health: [
    '물을 조금 더 자주 마시고, 20분 정도 가볍게 걸어보세요.',
    '잠들기 1시간 전 화면 사용을 줄이면 컨디션이 달라져요.',
    '몸이 보내는 신호를 한 번 체크하고 무리한 일정은 줄여보세요.',
    '식사·수면·움직임 중 하나만 오늘 확실히 챙겨주세요.',
  ],
};

const AVOID_MAP: Record<string, string[]> = {
  overall: [
    '멀티태스킹으로 한 번에 여러 일을 벌리는 건 피해주세요.',
    '중요한 결정을 피곤한 시간대에 내리지 마세요.',
    '오늘은 확인 없이 바로 약속을 늘리는 흐름을 조심하세요.',
    '내가 감당할 수 있는 범위를 넘겨서 떠안지 마세요.',
  ],
  love: [
    '감정이 올라온 상태에서 긴 메시지를 보내지 마세요.',
    '상대의 의도를 단정 짓는 말투는 오늘 특히 피해주세요.',
    '읽씹·답장 속도만 보고 마음을 예단하지 마세요.',
    '서운함을 농담처럼 돌려 말하면 오해가 커질 수 있어요.',
  ],
  money: [
    '충동구매 앱 결제는 오늘 하루만 미뤄보세요.',
    '체면 지출(괜히 쏘기)은 예산 안에서만 하세요.',
    '할인율만 보고 필요 없는 물건을 담지 마세요.',
    '기분 전환용 결제가 반복되지 않게 한 번 멈춰주세요.',
  ],
  work: [
    '완벽주의로 마감 자체를 늦추는 건 피해주세요.',
    '즉흥적인 말로 팀 분위기를 흔들지 않게 주의하세요.',
    '확인 안 된 정보를 확정처럼 말하지 마세요.',
    '피곤한 상태에서 바로 반박하기보다 메모 후 답하세요.',
  ],
  health: [
    '카페인 과다·야식은 오늘 피로를 키울 수 있어요.',
    '통증 신호를 무시하고 무리 운동하는 건 피해주세요.',
    '컨디션이 애매한데 일정을 꽉 채우는 건 피해주세요.',
    '쉬어야 할 때 죄책감 때문에 계속 버티지 마세요.',
  ],
};

const LUCKY_TIME_MAP: Record<string, string[]> = {
  overall: ['09:00~11:00', '10:30~12:00', '14:00~15:30'],
  love: ['18:30~20:30', '19:00~21:00', '20:00~21:30'],
  money: ['10:30~12:00', '11:00~13:00', '15:00~16:30'],
  work: ['08:30~10:30', '09:00~10:30', '13:30~15:00'],
  health: ['07:30~08:30', '21:00~22:00', '22:00~22:40'],
};

const TALK_MAP: Record<string, string[]> = {
  overall: [
    '오늘은 “이건 제가 먼저 해볼게요.” 한마디가 흐름을 살려줘요.',
    '오늘은 “우선순위부터 맞춰볼게요.” 라고 말하면 정리가 빨라져요.',
    '오늘은 “지금 필요한 건 이 한 가지예요.” 라고 좁혀 말해보세요.',
  ],
  love: [
    '오늘은 “네 마음 먼저 듣고 싶어.” 라는 말이 관계를 부드럽게 해줘요.',
    '오늘은 “그 말은 고마웠어.” 라고 구체적으로 표현해보세요.',
    '오늘은 “내가 너무 단정했을 수도 있어.” 한마디가 분위기를 풀어요.',
  ],
  money: [
    '오늘은 “이건 하루만 생각하고 결정할게요.” 라고 말해보세요.',
    '오늘은 “예산 안에서 다시 골라볼게요.” 라는 말이 지출을 잡아줘요.',
    '오늘은 “지금 꼭 필요한지 한 번 더 볼게요.” 라고 멈춰보세요.',
  ],
  work: [
    '오늘은 “핵심은 이 두 가지예요.” 라고 요약하면 신뢰가 올라가요.',
    '오늘은 “결론부터 말하면 이렇게입니다.” 라고 시작하면 전달력이 좋아져요.',
    '오늘은 “제가 확인한 범위는 여기까지예요.” 라고 선을 분명히 해보세요.',
  ],
  health: [
    '오늘은 “잠깐 쉬고 다시 할게요.”라고 말하는 용기가 필요해요.',
    '오늘은 “오늘 컨디션에 맞춰서 조절할게요.” 라고 말해도 괜찮아요.',
    '오늘은 “무리하지 않는 쪽으로 할게요.” 가 몸을 지켜줘요.',
  ],
};

const NO_NO_MAP: Record<string, string[]> = {
  overall: [
    '오늘은 동시에 여러 결정을 한 번에 내리지 마세요.',
    '오늘은 할 일을 더 벌리기보다 하나를 닫는 쪽이 안전해요.',
    '오늘은 피곤한 시간대에 중요한 약속을 확정하지 마세요.',
  ],
  love: [
    '오늘은 답답함이 올라와도 단정적인 말투는 피해주세요.',
    '오늘은 상대 반응을 확인하기 전에 혼자 결론 내리지 마세요.',
    '오늘은 긴 메시지보다 짧고 다정한 확인이 좋아요.',
  ],
  money: [
    '오늘은 할인 문구만 보고 바로 결제하지 마세요.',
    '오늘은 기분 따라 결제 한도를 올리지 마세요.',
    '오늘은 비교 없이 첫 번째 선택지로 결제하지 마세요.',
  ],
  work: [
    '오늘은 감정 섞인 즉답보다 메모 후 답변이 안전해요.',
    '오늘은 확인 안 된 일정·숫자를 단정해서 말하지 마세요.',
    '오늘은 완벽하게 만들겠다고 공유 타이밍을 놓치지 마세요.',
  ],
  health: [
    '오늘은 피곤한데도 무리한 운동 강행은 피해주세요.',
    '오늘은 수면 부족을 카페인으로만 버티지 마세요.',
    '오늘은 몸의 불편 신호를 “괜찮겠지”로 넘기지 마세요.',
  ],
};

const CROSS_DOMAIN_MISSIONS: Array<{ morning: string; noon: string; night: string }> = [
  {
    morning: '아침에 책상 위 물건 3개만 정리하고 오늘 첫 일을 시작해보세요.',
    noon: '낮에는 5분 산책으로 머리를 비우고 다시 우선순위를 잡아보세요.',
    night: '저녁엔 오늘 남은 생각을 메모 3줄로 비워내고 쉬어보세요.',
  },
  {
    morning: '아침에 물 한 컵을 마시고 가장 쉬운 루틴 1개부터 완료하세요.',
    noon: '낮에는 고마운 사람 1명에게 짧은 감사 표현을 남겨보세요.',
    night: '저녁엔 내일 돈 쓸 가능성이 큰 항목 1개를 미리 정리하세요.',
  },
  {
    morning: '아침에 오늘 안 해도 되는 일 1개를 지워 집중 공간을 만드세요.',
    noon: '낮에는 결제 전 한 번 멈추고 필요한 이유를 한 문장으로 확인하세요.',
    night: '저녁엔 휴대폰을 20분 일찍 내려놓고 호흡을 천천히 정리하세요.',
  },
  {
    morning: '아침에 연락 미룬 사람 1명을 떠올리고 부담 없는 한 줄을 준비하세요.',
    noon: '낮에는 반복되는 일을 하나만 자동화하거나 체크리스트로 바꿔보세요.',
    night: '저녁엔 오늘 나를 힘들게 한 장면을 정리하고 내일 피할 방법을 적어보세요.',
  },
  {
    morning: '아침에 지갑·가방·메모 중 하나를 3분만 정리하고 출발하세요.',
    noon: '낮에는 말하기 전에 목적을 먼저 정해 표현을 짧고 선명하게 해보세요.',
    night: '저녁엔 오늘 잘 지킨 루틴 1개를 체크하고 작게 칭찬해주세요.',
  },
  {
    morning: '아침에 오늘 나에게 필요한 회복 행동 1개를 일정에 먼저 넣어보세요.',
    noon: '낮에는 미뤄둔 작은 정리 1개를 10분 안에 끝내보세요.',
    night: '저녁엔 내일 아침 바로 할 일 1개만 남기고 나머지는 내려놓으세요.',
  },
];

const MISSION_MAP: Record<string, Array<{ morning: string; noon: string; night: string }>> = {
  overall: [
    {
      morning: '아침에 오늘의 최우선 1가지를 25분만 먼저 시작해보세요.',
      noon: '점심 전 불필요한 일 1개를 과감히 미루세요.',
      night: '저녁에 오늘 한 일 3줄 요약으로 흐름을 정리해보세요.',
    },
    {
      morning: '아침에 오늘 꼭 끝낼 일 1개를 메모 맨 위에 적어두세요.',
      noon: '낮에는 일정 하나를 줄여 여유 시간을 확보해보세요.',
      night: '저녁엔 내일로 넘길 일과 끝낸 일을 분리해두세요.',
    },
  ],
  love: [
    {
      morning: '아침에 고마운 사람 1명에게 짧은 안부를 보내보세요.',
      noon: '낮에는 상대 말 1가지를 끝까지 듣고 바로 공감해보세요.',
      night: '저녁에 마음 표현 한 문장을 직접 전해보세요.',
    },
    {
      morning: '아침에 먼저 연락할 사람을 하나만 정해보세요.',
      noon: '낮에는 대화 중 판단보다 질문을 하나 더 해보세요.',
      night: '저녁엔 오늘 고마웠던 장면을 짧게 기록해보세요.',
    },
  ],
  money: [
    {
      morning: '아침에 오늘 지출 한도를 숫자로 먼저 정해보세요.',
      noon: '낮에는 결제 전 10초 멈춤 규칙을 꼭 지켜보세요.',
      night: '저녁에 결제내역 3개만 점검하고 내일 한도를 조정하세요.',
    },
    {
      morning: '아침에 오늘 쓰지 않을 돈 1가지를 먼저 정하세요.',
      noon: '낮에는 구독·포인트·쿠폰 중 하나를 확인해보세요.',
      night: '저녁엔 오늘 잘 막은 지출 1개를 기록해보세요.',
    },
  ],
  work: [
    {
      morning: '아침에 가장 어려운 업무를 40분 먼저 처리해보세요.',
      noon: '낮에는 회의/대화 전 핵심 2줄을 메모해 전달하세요.',
      night: '저녁에 내일 첫 작업 1개를 캘린더에 고정해두세요.',
    },
    {
      morning: '아침에 오늘 보여줄 결과물 1개를 작게 쪼개 시작하세요.',
      noon: '낮에는 요청사항을 목적·기한·담당으로 나눠 확인하세요.',
      night: '저녁엔 오늘 쌓은 성과 근거 1개를 저장해두세요.',
    },
  ],
  health: [
    {
      morning: '아침에 물 한 컵 + 가벼운 스트레칭 5분을 해보세요.',
      noon: '낮에는 15분만 걸으며 호흡을 정리해보세요.',
      night: '저녁엔 취침 1시간 전 화면을 줄이고 회복 시간을 확보하세요.',
    },
    {
      morning: '아침에 컨디션 점수를 1~10으로 적고 일정을 조절하세요.',
      noon: '낮에는 식사 후 10분만 천천히 걸어보세요.',
      night: '저녁엔 따뜻한 물이나 차로 몸을 먼저 진정시켜보세요.',
    },
  ],
};

const CLOSING_MAP: Record<string, string[]> = {
  overall: [
    '오늘 내가 가장 잘한 선택 1가지는 무엇이었나요?',
    '오늘 줄였더니 오히려 좋아진 일이 있었나요?',
    '오늘 내 기준을 지킨 순간은 언제였나요?',
  ],
  love: [
    '오늘 대화에서 내가 먼저 배려한 장면이 있었나요?',
    '오늘 마음을 조금 더 부드럽게 전한 순간이 있었나요?',
    '오늘 상대를 단정하지 않고 들어준 순간이 있었나요?',
  ],
  money: [
    '오늘 지출 중 내 기준에 맞았던 소비는 무엇이었나요?',
    '오늘 잘 미룬 결제나 잘 줄인 지출이 있었나요?',
    '오늘 돈을 쓰기 전 한 번 멈춘 순간이 있었나요?',
  ],
  work: [
    '오늘 업무에서 핵심을 잘 전달한 순간이 있었나요?',
    '오늘 작게라도 결과물로 남긴 것은 무엇이었나요?',
    '오늘 확인하고 답해서 실수를 줄인 장면이 있었나요?',
  ],
  health: [
    '오늘 내 몸이 보내준 신호를 잘 챙긴 순간이 있었나요?',
    '오늘 무리하지 않기로 선택한 장면이 있었나요?',
    '오늘 컨디션을 지키기 위해 줄인 것은 무엇이었나요?',
  ],
};

export function buildTodayActionGuide({
  sections,
  date,
  personalSeed = 'anonymous',
}: {
  sections: TodayGuideSection[];
  date: Date;
  personalSeed?: string;
}): TodayActionGuide | null {
  if (sections.length === 0) return null;

  const topSection = sections.reduce((best, cur) => (cur.score > best.score ? cur : best), sections[0]);
  const lowSection = sections.reduce((worst, cur) => (cur.score < worst.score ? cur : worst), sections[0]);
  const seed = scopedSeed([personalSeed, dateKey(date), topSection.id, topSection.score, lowSection.id, lowSection.score]);

  const topDo = rotateBySeed(seed, `do:${topSection.id}`, DO_MAP[topSection.id] ?? DO_MAP.overall, 2);
  const lowAvoid = rotateBySeed(seed, `avoid:${lowSection.id}`, AVOID_MAP[lowSection.id] ?? AVOID_MAP.overall, 2);

  const doList = [
    ...topDo,
    pickBySeed(seed, 'top-extra', [
      `오늘의 강점은 ${topSection.label}이에요. 관련 행동을 하나 더 해보면 좋아요.`,
      `${topSection.label}이 잘 받쳐주는 날이라, 작은 실행을 눈에 보이게 남겨보세요.`,
      `${topSection.label} 쪽 기운을 살리려면 오늘 한 번은 먼저 움직이는 게 좋아요.`,
    ]),
  ].slice(0, 3);

  const avoidList = [
    ...lowAvoid,
    pickBySeed(seed, 'low-extra', [
      `${lowSection.label} 쪽은 예민할 수 있으니, 서두르지 말고 한 박자 쉬어가세요.`,
      `${lowSection.label} 관련 선택은 오늘 바로 밀어붙이기보다 확인 후 움직이세요.`,
      `${lowSection.label}은 컨디션·감정 영향을 받기 쉬우니 여유를 남겨두세요.`,
    ]),
  ].slice(0, 3);

  return {
    doList,
    avoidList,
    luckyTime: pickBySeed(seed, `lucky:${topSection.id}`, LUCKY_TIME_MAP[topSection.id] ?? LUCKY_TIME_MAP.overall),
    todayOneLine: pickBySeed(seed, `talk:${topSection.id}`, TALK_MAP[topSection.id] ?? TALK_MAP.overall),
    todayNoNo: pickBySeed(seed, `nono:${lowSection.id}`, NO_NO_MAP[lowSection.id] ?? NO_NO_MAP.overall),
    missions: pickBySeed(seed, `mission:${topSection.id}`, [
      ...(MISSION_MAP[topSection.id] ?? MISSION_MAP.overall),
      ...CROSS_DOMAIN_MISSIONS,
    ]),
    closingQuestion: pickBySeed(seed, `closing:${lowSection.id}`, CLOSING_MAP[lowSection.id] ?? CLOSING_MAP.overall),
    tomorrowKickoff: pickBySeed(seed, 'tomorrow-kickoff', [
      `내일 시작 한 줄: ${topSection.label} 관련 가장 작은 행동 1개를 아침에 바로 시작해보세요.`,
      `내일 시작 한 줄: 오늘 좋았던 ${topSection.label} 흐름을 15분짜리 행동으로 이어가세요.`,
      `내일 시작 한 줄: ${topSection.label}에서 바로 실행할 일 1개를 캘린더 첫 칸에 넣어두세요.`,
    ]),
  };
}

const MONTH_MISSION_MAP: Record<string, Array<{ start: string; keep: string; finish: string }>> = {
  총운: [
    {
      start: '이번 달 1주차에 가장 중요한 목표 1개를 정하고, 시작일을 달력에 고정하세요.',
      keep: '주 1회(예: 일요일 밤) 진행 상황을 3줄로 점검해 흐름을 유지하세요.',
      finish: '월말에는 완료한 것 3가지를 적고 다음 달로 넘길 1가지만 남기세요.',
    },
    {
      start: '월초에는 이번 달 기준이 될 목표 1개만 남기고 나머지는 후보로 내려두세요.',
      keep: '매주 같은 요일에 10분만 점검해 계획이 커지지 않게 관리하세요.',
      finish: '월말엔 끝낸 일·미룬 일·다음 달 첫 일로 나눠 정리하세요.',
    },
  ],
  '일·커리어': [
    {
      start: '초반 10일 안에 가장 영향 큰 업무 1개를 먼저 끝내세요.',
      keep: '회의/보고 전 핵심 2줄 요약 습관으로 전달력을 유지하세요.',
      finish: '월말에 성과 근거(숫자/사례) 3개를 정리해 다음 기회를 준비하세요.',
    },
    {
      start: '월초에 이번 달 보여줄 결과물 1개를 정하고 작은 산출물부터 만드세요.',
      keep: '주중에는 요청사항을 목적·마감·담당으로 분리해 확인하세요.',
      finish: '월말에는 잘된 업무 1개를 포트폴리오/메모로 남겨두세요.',
    },
  ],
  연애: [
    {
      start: '이번 달 초에 먼저 연락할 사람 1명을 정하고 짧은 안부를 보내세요.',
      keep: '주 1회는 감정보다 사실 중심으로 대화해 오해를 줄이세요.',
      finish: '월말에 관계에서 좋았던 장면 1개를 다시 표현해 따뜻하게 마무리하세요.',
    },
    {
      start: '월초에는 관계에서 먼저 챙길 표현 1가지를 정해보세요.',
      keep: '매주 한 번은 상대 이야기를 끊지 않고 끝까지 들어보세요.',
      finish: '월말엔 고마웠던 순간을 짧게 전하며 온도를 맞춰주세요.',
    },
  ],
  재물: [
    {
      start: '월초에 고정지출/변동지출 한도를 먼저 숫자로 정하세요.',
      keep: '결제 전 10초 멈춤 규칙으로 충동 지출을 관리하세요.',
      finish: '월말에 절약/과소비 항목 1개씩만 기록해 다음 달 기준을 만드세요.',
    },
    {
      start: '월초에는 이번 달 쓰지 않을 지출 1개를 먼저 정하세요.',
      keep: '주 1회 카드내역 5분 점검으로 새는 돈을 막아보세요.',
      finish: '월말엔 잘 지킨 돈 습관 1개를 다음 달 자동 루틴으로 넘기세요.',
    },
  ],
};

const MONTH_CAUTION_MAP: Record<string, string[]> = {
  총운: [
    '이번 달은 동시에 여러 목표를 벌리기보다, 하나씩 끝내는 방식이 유리해요.',
    '이번 달은 속도보다 범위 조절이 중요해요. 할 일을 늘리기 전에 하나를 닫아주세요.',
  ],
  '일·커리어': [
    '피로한 상태의 즉답·즉결은 손해가 될 수 있어요. 메모 후 답변하세요.',
    '이번 달 업무는 말보다 근거가 중요해요. 숫자·기한·담당을 확인하세요.',
  ],
  연애: [
    '감정이 올라온 날엔 단정적인 말투를 피하고, 한 박자 쉬고 말해주세요.',
    '이번 달 관계운은 오해 관리가 핵심이에요. 확인 전 결론부터 내리지 마세요.',
  ],
  재물: [
    '할인·한정 문구만 보고 바로 결제하지 말고 하루만 더 확인하세요.',
    '이번 달은 기분 전환 지출이 반복되기 쉬워요. 한도부터 정해두세요.',
  ],
};

export function buildMonthActionPlan({
  fields,
  monthScore,
  mood,
  tagline,
  bestDay,
  worstDay,
  ym,
  personalSeed = 'anonymous',
}: {
  fields: MonthPlanField[];
  monthScore: number;
  mood: string;
  tagline: string;
  bestDay: number;
  worstDay: number;
  ym?: string;
  personalSeed?: string;
}): MonthActionPlan | null {
  if (fields.length === 0) return null;

  const top = fields.reduce((a, b) => (b.score > a.score ? b : a), fields[0]);
  const low = fields.reduce((a, b) => (b.score < a.score ? b : a), fields[0]);
  const sorted = [...fields].sort((a, b) => b.score - a.score);
  const seed = scopedSeed([personalSeed, ym ?? monthKey(new Date()), top.lbl, top.score, low.lbl, low.score, monthScore]);

  const weekFocusTemplates = [
    [
      `1주차: ${sorted[0].lbl}에 시간을 먼저 배치하세요.`,
      `2주차: ${sorted[1]?.lbl ?? sorted[0].lbl} 루틴을 가볍게 반복하세요.`,
      `3주차: ${low.lbl}는 결정 속도를 늦추고 점검 중심으로 가세요.`,
      `4주차: ${top.lbl} 성과 1개를 정리해 다음 달로 연결하세요.`,
    ],
    [
      `1주차: ${top.lbl} 관련 시작 일을 작게 쪼개 착수하세요.`,
      `2주차: ${sorted[1]?.lbl ?? top.lbl} 흐름을 유지할 반복 루틴을 넣으세요.`,
      `3주차: ${low.lbl} 리스크는 큰 결정 대신 점검으로 낮추세요.`,
      `4주차: 이번 달에 남길 ${top.lbl} 기록 1개를 마무리하세요.`,
    ],
  ];

  const weeklyRhythmTemplates = [
    [
      `월초(1~7일): ${top.lbl} 관련 시작 버튼을 누르기 좋은 구간`,
      `중반(8~21일): 루틴 유지 + 작은 피드백 반영으로 안정화`,
      `월말(22일~): ${low.lbl} 리스크 줄이기 + 다음 달 예약 1개`,
    ],
    [
      `월초(1~7일): ${top.lbl}에 필요한 준비물을 먼저 갖추는 구간`,
      `중반(8~21일): ${sorted[1]?.lbl ?? top.lbl}까지 넓히되 과부하는 피하기`,
      `월말(22일~): ${low.lbl} 쪽 미해결 항목을 정리하고 마감하기`,
    ],
  ];

  return {
    topLabel: top.lbl,
    lowLabel: low.lbl,
    missions: pickBySeed(seed, `month-mission:${top.lbl}`, MONTH_MISSION_MAP[top.lbl] ?? MONTH_MISSION_MAP.총운),
    caution: pickBySeed(seed, `month-caution:${low.lbl}`, MONTH_CAUTION_MAP[low.lbl] ?? MONTH_CAUTION_MAP.총운),
    monthClosing: pickBySeed(seed, 'month-closing', [
      `${top.lbl} 흐름을 다음 달에도 이어가기 위해, 월말 마지막 날에 같은 행동 1개를 미리 예약해두세요.`,
      `월말에는 ${top.lbl}에서 잘된 점 1개를 남기고, 다음 달 첫 주 일정에 바로 연결하세요.`,
      `${top.lbl} 운을 놓치지 않게 이번 달 마지막 주에 반복 가능한 루틴 1개로 고정하세요.`,
    ]),
    weekFocus: pickBySeed(seed, 'week-focus', weekFocusTemplates),
    monthlyChecklist: rotateBySeed(seed, 'monthly-checklist', [
      `좋은 날(${bestDay}일)엔 중요한 약속/결정을 배치하세요.`,
      `주의할 날(${worstDay}일)엔 큰 결정보다 유지 업무로 운영하세요.`,
      `${top.lbl} 관련 완료 항목 1개를 꼭 기록으로 남겨주세요.`,
      `${low.lbl} 쪽은 미리 한계를 정하면 부담이 줄어요.`,
      `이번 달 마지막 주에는 다음 달 첫 행동 1개를 캘린더에 넣어두세요.`,
    ], 3),
    scoreCommentary: [
      `${top.lbl}(${top.score}점)은 이번 달에 가장 밀어주기 좋은 파트예요. 시간과 에너지를 먼저 배치하세요.`,
      `${low.lbl}(${low.score}점)은 속도보다 점검이 중요한 파트예요. 급하게 밀어붙이지 않는 게 이득이에요.`,
      `총점 ${monthScore}점 기준으로, 이번 달은 "${mood}" 흐름이에요. ${tagline}`,
    ],
    weeklyRhythm: pickBySeed(seed, 'weekly-rhythm', weeklyRhythmTemplates),
  };
}
