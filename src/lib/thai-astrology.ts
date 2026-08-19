import { lunarToSolarSafe, type SolarDate } from './saju';
import type { OhaengKey } from '../components/ie';

/**
 * 태국 점성술 (요일 운세) — "내가 태어난 요일이 나의 수호신·수호색을 정한다".
 *
 * 힌두 나와그라하(9요성) 기반 태국 전통 체계:
 * - 요일 7개 + 수요일을 낮/밤으로 나눠 총 8일 체계 (수요일 밤 = 라후)
 * - 날짜 경계는 자정이 아니라 **새벽 6시(일출)** — 새벽 출생자는 전날 소속
 * - 수요일 밤(라후) 구간: 수요일 18:00 ~ 목요일 06:00
 *
 * 행운색·금기색은 태국에서 대중적으로 통용되는 버전 기준 (출처별 차이 존재).
 * 수호 불상은 텍스트로만 소개 (종교 이미지 시각화는 하지 않는다 — 절제 원칙).
 */

export type ThaiDayKey =
  | 'sun' | 'mon' | 'tue' | 'wedDay' | 'wedNight' | 'thu' | 'fri' | 'sat';

export type ThaiDayContent = {
  /** 표시용 요일명 (예: "수요일 밤") */
  weekdayKr: string;
  /** 수호 행성신 — plain(쉬운 별칭)을 이름 앞에 붙여 표시 (예: '밤의 별 라후') */
  deity: { name: string; plain: string; desc: string };
  /** 수호 캐릭터 이름 (예: '그믐 고양이') — 이미지: public/thai/{key}.png */
  animal: string;
  /** 행운색 (표시명 + 카드용 hex) */
  color: { name: string; hex: string };
  /** 다크 배경 표시용 액센트 — 행운색이 어두워 대비가 안 나올 때만 별도 지정 */
  accent?: string;
  /** 피하면 좋다는 색 (통용 버전) */
  avoidColor: string;
  /** 수호 불상 (텍스트 소개만) */
  buddha: string;
  /** 성격 풀이 (해요체, 2~3문장) */
  personality: string;
  /** 키워드 3개 (카드용) */
  keywords: [string, string, string];
  /** 요일색 → 가장 가까운 오행 (용신 교차용) */
  ohaeng: OhaengKey;
};

export const THAI_DAYS: Record<ThaiDayKey, ThaiDayContent> = {
  sun: {
    animal: '한낮 사자',
    weekdayKr: '일요일',
    deity: { name: '수리야', plain: '태양의 신', desc: '한낮의 해처럼 당당한 기운을 주는 신이에요' },
    color: { name: '빨강', hex: '#E85D4A' },
    avoidColor: '파랑',
    buddha: '이레 동안 눈을 감지 않고 나무를 바라봤다는 부처님이에요. 흔들리지 않는 마음을 지켜줘요',
    personality:
      '태양 아래 태어난 사람은 어디서든 눈에 띄어요. 자존심이 강하고 리더 기질이 있어서, 남을 따르기보다 이끌 때 빛나요. 화끈하게 베푸는 정도 매력이에요.',
    keywords: ['리더십', '당당함', '존재감'],
    ohaeng: 'fire',
  },
  mon: {
    animal: '보름 사슴',
    weekdayKr: '월요일',
    deity: { name: '찬드라', plain: '달의 신', desc: '보름달처럼 은은하게 마음을 어루만지는 신이에요' },
    color: { name: '노랑·크림', hex: '#F2C14E' },
    avoidColor: '빨강',
    buddha: '두 손을 들어 다툼을 말렸다는 부처님이에요. 내 마음의 평화를 지켜줘요',
    personality:
      '달의 사람은 부드럽지만 잊는 게 없어요. 섬세한 기억력과 은은한 매력으로 사람을 끌어당기고, 감정의 밀물과 썰물을 겪는 만큼 공감 능력이 깊어요.',
    keywords: ['온화함', '기억력', '은은한 매력'],
    ohaeng: 'earth',
  },
  tue: {
    animal: '불꽃 여우',
    weekdayKr: '화요일',
    deity: { name: '망갈라', plain: '전사의 별', desc: '화성처럼 뜨거운 용기를 주는 신이에요' },
    color: { name: '분홍', hex: '#F08CA4' },
    avoidColor: '노랑·흰색',
    buddha: '옆으로 편안히 누워 쉬는 모습의 부처님이에요. 지친 몸과 마음을 쉬게 해줘요',
    personality:
      '전사의 별 아래 태어났어요. 돌려 말하는 법이 없고, 하고 싶은 건 해야 직성이 풀려요. 그 직진력이 주변엔 뜨거운 에너지가 돼요. 참는 건 좀 어렵죠.',
    keywords: ['용기', '열정', '직진'],
    ohaeng: 'fire',
  },
  wedDay: {
    animal: '바람 앵무',
    weekdayKr: '수요일 낮',
    deity: { name: '부다', plain: '지혜의 별', desc: '수성처럼 빠른 머리와 말솜씨를 주는 신이에요' },
    color: { name: '초록', hex: '#5CB271' },
    avoidColor: '분홍',
    buddha: '밥그릇을 들고 아침 공양을 받는 부처님이에요. 하루하루 먹고사는 복을 채워줘요',
    personality:
      '말로 사람 마음을 여는 재주를 타고났어요. 눈치가 빠르고 수완이 좋아 어떤 자리에서도 금방 어울려요. 장사·협상·소통이 필요한 곳에서 유난히 강해요.',
    keywords: ['말솜씨', '사교성', '수완'],
    ohaeng: 'wood',
  },
  wedNight: {
    animal: '그믐 고양이',
    weekdayKr: '수요일 밤',
    deity: { name: '라후', plain: '밤의 별', desc: '해와 달을 삼킨다고 전해지는 신비한 별이에요. 남다른 운명을 상징하죠' },
    color: { name: '짙은 회색·검정', hex: '#4A4A58' },
    accent: '#ADA6C9',
    avoidColor: '노랑',
    buddha: '숲속에 홀로 있을 때 코끼리와 원숭이가 먹을 것을 가져다줬다는 부처님이에요. 혼자인 순간에도 곁을 지켜줘요',
    personality:
      '태국에서도 특별하게 여기는, 라후의 사람이에요. 남들이 못 보는 걸 꿰뚫어 보는 직관이 있고, 평범한 길보다 자기만의 길에서 진가가 드러나요. 밤에 더 강해지는 타입이죠.',
    keywords: ['직관', '비범함', '개성'],
    ohaeng: 'water',
  },
  thu: {
    animal: '고요 부엉이',
    weekdayKr: '목요일',
    deity: { name: '구루', plain: '스승의 별', desc: '목성처럼 넓고 깊은 지혜를 주는, 신들의 스승이에요' },
    color: { name: '주황', hex: '#EE9B4A' },
    avoidColor: '보라',
    buddha: '고요히 앉아 명상하는 모습의 부처님이에요. 마음이 흔들릴 때 중심을 잡아줘요',
    personality:
      '스승의 별 아래 태어났어요. 차분하게 앉아 무언가를 파고드는 힘이 있고, 주변 사람들이 자연스레 조언을 구하러 와요. 배우고 가르치는 자리에서 운이 트여요.',
    keywords: ['지혜', '차분함', '스승 기질'],
    ohaeng: 'earth',
  },
  fri: {
    animal: '새벽 공작',
    weekdayKr: '금요일',
    deity: { name: '슈크라', plain: '사랑의 별', desc: '금성처럼 사랑과 아름다움을 끌어당기는 신이에요' },
    color: { name: '하늘색', hex: '#6FB4D8' },
    avoidColor: '짙은 남색',
    buddha: '가슴에 손을 얹고 생각에 잠긴 부처님이에요. 바쁜 마음에 여유를 돌려줘요',
    personality:
      '사랑받는 별의 사람이에요. 예술적인 감각이 있고 다정해서 곁에 사람이 끊이지 않아요. 아름다운 것을 알아보는 눈이 곧 재능이니, 그 감각을 믿어도 돼요.',
    keywords: ['다정함', '예술 감각', '인기'],
    ohaeng: 'water',
  },
  sat: {
    animal: '바위 거북',
    weekdayKr: '토요일',
    deity: { name: '샤니', plain: '인내의 별', desc: '토성처럼 묵직하게 버티는 힘을 주는 신이에요' },
    color: { name: '보라', hex: '#8B6FC0' },
    avoidColor: '초록',
    buddha: '큰 뱀이 우산처럼 몸을 펼쳐 비를 막아줬다는 부처님이에요. 궂은 날의 든든한 우산이 돼줘요',
    personality:
      '단단한 별 아래 태어났어요. 겉은 조용해도 속은 누구보다 강인해서, 남들이 포기하는 지점에서 한 걸음 더 가요. 시간이 걸릴 뿐, 늦게 피는 꽃이 더 오래가요.',
    keywords: ['인내', '강인함', '깊이'],
    ohaeng: 'water',
  },
};

export type ThaiBirthInput = {
  year: number;
  month: number;
  day: number;
  calendar: 'solar' | 'lunar';
  leapMonth?: boolean;
  /** 시 (0~23). 모름이면 undefined → 새벽 경계·라후 판정 없이 달력 요일 사용 */
  hour?: number;
  minute?: number;
};

export type ThaiBirthDay = ThaiDayContent & {
  key: ThaiDayKey;
  /** 시간 정보가 있어 새벽 6시 경계·라후 판정을 적용했는지 */
  usedDawnRule: boolean;
};

/** 0(일)~6(토) → 낮 기준 ThaiDayKey */
const DAY_BY_DOW: ThaiDayKey[] = ['sun', 'mon', 'tue', 'wedDay', 'thu', 'fri', 'sat'];

/**
 * 태어난 요일 계산 (태국 전통 규칙).
 *
 * - 음력 입력은 saju.ts 의 lunarToSolarSafe 로 양력 변환 (경계 케이스 보정 동일 적용)
 * - 시간을 알면: 출생 시각에서 6시간을 빼서 새벽 6시 경계를 적용
 *   (새벽 3시 출생 → 전날 요일 소속)
 * - 라후(수요일 밤): 경계 적용 후 수요일 && 출생 시각이 18:00~06:00 구간
 * - 시간 모름: 달력 요일 그대로 (낮 기준), usedDawnRule=false
 */
export function thaiBirthDay(input: ThaiBirthInput): ThaiBirthDay {
  const solar: SolarDate =
    input.calendar === 'lunar'
      ? lunarToSolarSafe(input.year, input.month, input.day, input.leapMonth ?? false)
      : { year: input.year, month: input.month, day: input.day };

  const unknownTime = input.hour === undefined;
  const hour = input.hour ?? 12;
  const minute = input.minute ?? 0;

  const birth = new Date(solar.year, solar.month - 1, solar.day, hour, minute);
  // 새벽 6시 경계: 시간 알 때만 -6시간 이동한 날짜의 요일 사용
  const effective = unknownTime
    ? birth
    : new Date(birth.getTime() - 6 * 60 * 60 * 1000);

  let key: ThaiDayKey = DAY_BY_DOW[effective.getDay()];

  // 라후 판정 — 유효 요일이 수요일이고, 출생 시각이 밤 구간(18:00~06:00)
  if (!unknownTime && key === 'wedDay' && (hour >= 18 || hour < 6)) {
    key = 'wedNight';
  }

  return { key, usedDawnRule: !unknownTime, ...THAI_DAYS[key] };
}

/** 요일 캐릭터 이미지 경로 — 8종 모두 존재 (public/thai/) */
export function thaiCharacterImg(key: ThaiDayKey): string {
  return `/thai/${key}.png?v=1`;
}

/** 요일색 오행과 용신 오행 교차 → 행운색 코멘트 (공유 카드용 한 줄) */
export function thaiLuckComment(day: ThaiBirthDay, yongshin: OhaengKey): string {
  if (day.ohaeng === yongshin) {
    return `내 사주가 추천하는 색과 태국 수호색이 같은 기운이에요. ${day.color.name}은 두 겹의 행운색 — 오늘 하나쯤 몸에 지녀보세요.`;
  }
  return `내 사주가 추천하는 색과 함께 쓰면 좋아요. 태국 수호색 ${day.color.name}을 포인트로 더하면 두 운이 나란히 걸어요.`;
}
