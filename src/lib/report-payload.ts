/**
 * 리포트 생성 서버로 보낼 명식 재료.
 *
 * 프롬프트가 이 JSON 의 키 이름을 그대로 읽는다(`명식`, `오행분포`, `대운` …).
 * 앱과 테스트 스크립트가 같은 형식을 써야 하므로 여기 한 곳에서만 만든다.
 * 키를 바꾸면 supabase/functions/report/prompt.ts 의 데이터 설명도 같이 고쳐야 한다.
 */
import { OHAENG_KR, TG_KR, DZ_KR, type Myeongsik, type SajuInput } from './saju';
import { getSipsung } from './sipsung';
import { getDaewoon, getSeun } from './daewoon';
import { getSinsal } from './sinsal';
import { spiritFromMyeongsik } from './spirit';

export function buildReportPayload(ms: Myeongsik, profile: SajuInput) {
  const kr = (c: string) => TG_KR[c] ?? DZ_KR[c] ?? c;
  const sp = spiritFromMyeongsik(ms);
  const who = { year: profile.year, gender: profile.gender };

  return {
    입력: {
      생년월일: `${profile.year}-${profile.month}-${profile.day}`,
      시: profile.hour ?? '모름',
      성별: profile.gender === 'male' ? '남' : '여',
    },
    명식: ms.pillars.map((p) => ({
      기둥: p.label,
      간지: `${p.top.c}${p.bot.c}`,
      한글: `${kr(p.top.c)}${kr(p.bot.c)}`,
      천간십성: p.isSelf ? '일간(나)' : getSipsung(ms.ilgan.c as never, p.top.c as never),
      오행: `${OHAENG_KR[p.top.ohaeng]}/${OHAENG_KR[p.bot.ohaeng]}`,
    })),
    일간: `${ms.ilgan.c}(${kr(ms.ilgan.c)}) · ${OHAENG_KR[ms.ilgan.ohaeng]}`,
    오행분포: Object.fromEntries(
      (Object.entries(ms.ohaeng) as [keyof typeof ms.ohaeng, number][])
        .map(([k, v]) => [OHAENG_KR[k], v]),
    ),
    신강신약: {
      판정: ms.shinkang.label,
      용신: OHAENG_KR[ms.shinkang.yongshin.ohaeng],
      사유: ms.shinkang.yongshinReason,
    },
    시모름: ms.unknownTime,
    정령: { 이름: sp.name, 등급: sp.rarity.ko },
    대운: getDaewoon(ms, who),
    세운: getSeun(ms, who),
    신살: getSinsal(ms).map((s) => ({ 이름: s.name, has: s.has, 한줄: s.oneLine })),
  };
}
