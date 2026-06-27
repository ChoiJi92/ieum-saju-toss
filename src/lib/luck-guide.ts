import { OHAENG_KR, OHAENG_PULIE, type Myeongsik } from './saju';
import type { OhaengKey } from '../components/ie';

/**
 * 행운 가이드 — 색·방향·활동 (전통 명리 오행 색·방위).
 * - 성격(타고난 보완 오행=용신)은 personality.ts에서 별도 처리.
 * - 올해/이달은 그 기간의 천간(세운/월운) 오행 기반 → 기간마다 달라짐 (buildPeriodLuckGuide).
 */

export const COLOR_BY_OHAENG: Record<OhaengKey, string> = {
  wood: '초록·청록', fire: '빨강·분홍', earth: '노랑·베이지', metal: '흰색·골드', water: '검정·네이비',
};
export const DIR_BY_OHAENG: Record<OhaengKey, string> = {
  wood: '동쪽', fire: '남쪽', earth: '중앙', metal: '서쪽', water: '북쪽',
};
export const LUCK_ACTIVITY: Record<OhaengKey, string> = {
  wood: '산책·식물 키우기·독서처럼 차분히 자라는 활동',
  fire: '운동·사람 만나기·밝고 활기찬 자리',
  earth: '정리·저축·안정된 루틴 만들기',
  metal: '결단·정리정돈·깔끔한 마무리',
  water: '여행·물가 산책·유연하게 생각 바꾸기',
};

/** 천간 → 오행 */
export const STEM_OHAENG: Record<string, OhaengKey> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
};

/** 오행 상생 (A가 생하는 대상) */
const SHENG: Record<OhaengKey, OhaengKey> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };

export type LuckGuide = {
  elementKr: string;    // 목·화·토·금·수
  elementPulie: string; // 나무·불·흙·쇠·물
  color: string;
  direction: string;
  body: string;
  advice: string[];
};

/**
 * 기간(세운/월운) 오행 기반 행운 가이드 — 기간마다 달라짐.
 * 내 용신(보완 오행)과의 관계를 한 줄로 곁들여 개인화.
 * @param periodEl 그 기간의 천간 오행 (올해=세운, 이달=월운)
 * @param lead 문장 머리말 ("올해는" / "이번 달은")
 */
export function buildPeriodLuckGuide(
  periodEl: OhaengKey,
  myeongsik: Myeongsik,
  opts: { lead: string; advice?: string[] },
): LuckGuide {
  const y = myeongsik.shinkang.yongshin.ohaeng;
  const rel = periodEl === y
    ? `마침 ${OHAENG_PULIE[y]} 기운은 당신에게 가장 도움이 되는 기운이라, 이 색·방향을 곁에 두면 흐름이 크게 열려요.`
    : SHENG[periodEl] === y
      ? `이 기운이 당신에게 도움이 되는 ${OHAENG_PULIE[y]} 기운을 살려줘서, 함께 활용하면 좋아요.`
      : `여기에 당신의 보약인 ${OHAENG_PULIE[y]}(${OHAENG_KR[y]}) 기운을 같이 챙기면 균형이 맞아요.`;
  return {
    elementKr: OHAENG_KR[periodEl],
    elementPulie: OHAENG_PULIE[periodEl],
    color: COLOR_BY_OHAENG[periodEl],
    direction: DIR_BY_OHAENG[periodEl],
    body: `${opts.lead} ${OHAENG_PULIE[periodEl]}(${OHAENG_KR[periodEl]}) 기운이 강해요. ${rel}`,
    advice: [
      `${LUCK_ACTIVITY[periodEl]}을(를) 가까이 하세요. 행운 색은 ${COLOR_BY_OHAENG[periodEl]}, 좋은 방향은 ${DIR_BY_OHAENG[periodEl]}이에요.`,
      ...(opts.advice ?? []),
    ],
  };
}
