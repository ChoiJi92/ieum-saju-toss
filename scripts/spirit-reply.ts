/**
 * 스레드 리플 생성기 (정령편) — 생년월일 → 정령 이름·등급 + 복붙용 리플.
 *
 *   npx tsx scripts/spirit-reply.ts 1992-05-13
 *   npx tsx scripts/spirit-reply.ts 1992-05-13:7          # 시(時) 포함
 *   npx tsx scripts/spirit-reply.ts 1995-08-15:L          # 음력
 *   npx tsx scripts/spirit-reply.ts 1992-05-13 1988-11-03:14 1995-08-15:L   # 여러 명 한 번에
 *
 * 형식: YYYY-MM-DD[:시][:L]  (L = 음력)
 *
 * 톤 가이드: 해요체, AI 냄새 금지, 짧게.
 *   - 일반 등급은 등급을 언급하지 않는다 (위축되지 않게 캐릭터 매력만)
 *   - 희귀 이상만 등급·확률을 밝힌다 (자랑거리가 되게)
 */
import { computeMyeongsik } from '../src/lib/saju';
import { spiritFromMyeongsik, ELEMENTS, ZODIAC, type ElementKey } from '../src/lib/spirit';

/* ─── 등급 글용 리플 ────────────────────────────────────────
 * 스레드 "등급이 다릅니다" 글에 달리는 댓글용. 계열 글과 형식이 다르다.
 * 등급을 물으러 온 사람들이라 등급을 먼저 말하고, 일반이어도 숨기지 않는다.
 * 대신 "60종 중 하나뿐"으로 받쳐준다 — 실제로 60갑자와 1:1이라 참이고,
 * 이 한 줄이 일반 등급인 분들을 오히려 신나게 만들었다.
 */

/** 천간 → 한글 (일주 표기용) */
const STEM_KO: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
};
const BRANCH_KO: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
};

/** 오행 우리말 — 화면 막대와 같은 말을 쓴다 */
const OH: Record<ElementKey, string> = {
  wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물',
};
const SHENG: Record<ElementKey, ElementKey> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
const KE: Record<ElementKey, ElementKey> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};
/** 극(剋)은 관계마다 어울리는 말이 다르다. 전부 "누른다"로 쓰면 어색해진다. */
const KE_VERB: Record<ElementKey, string> = {
  wood: '붙드는',    // 나무가 흙을
  earth: '담아주는', // 흙이 물을
  water: '가라앉히는', // 물이 불을
  fire: '벼려내는',  // 불이 쇠를
  metal: '다듬는',   // 쇠가 나무를
};

/** 등급별 두 번째 문단 */
function gradeLine(rarityKo: string, ilju: string, name: string): string {
  if (rarityKo === '전설') return '전설입니다. 100명 중 7명만 나오는 조합이에요.';
  if (rarityKo === '영물') return '영물입니다. 예로부터 기운이 꽉 찬 날로 봐온 조합이고, 10명 중 1명쯤 나와요.';
  if (rarityKo === '희귀') return '희귀 조합입니다.';
  return `가장 흔한 등급이긴 한데, 60종 중에 ${ilju}일주는 ${name} 하나뿐이에요.\n등급과 별개로 조합 자체는 유일합니다.`;
}

/**
 * 위 글자와 아래 글자의 관계 한 줄.
 * 같은 오행이면 겹친 것, 아니면 생·극 방향을 짚는다.
 */
function relationLine(topEl: ElementKey, botEl: ElementKey): string {
  const t = OH[topEl], b = OH[botEl];
  // josa 는 조사만 돌려준다. 단어까지 붙이려면 여기서 이어야 한다.
  const ig = (w: string) => `${w}${josa(w, '이', '가')}`;
  const eul = (w: string) => `${w}${josa(w, '을', '를')}`;
  if (topEl === botEl) return `같은 ${ig(t)} 위아래로 겹친 자리라,`;
  if (SHENG[botEl] === topEl) return `${ig(b)} ${eul(t)} 만들어주는 자리라,`;
  if (SHENG[topEl] === botEl) return `${ig(t)} ${eul(b)} 살려주는 자리라,`;
  if (KE[topEl] === botEl) return `${ig(t)} ${eul(b)} ${KE_VERB[topEl]} 자리라,`;
  return `${ig(b)} ${eul(t)} ${KE_VERB[botEl]} 자리라,`;
}

/**
 * 관계에 이어 붙는 마무리. 여기까지 있어야 문장이 끝난다.
 * 사람마다 다르게 쓰던 부분이라 관계별 기본형만 둔다 — 필요하면 손으로 고친다.
 */
const SAME_CLOSING: Record<ElementKey, string> = {
  wood: '한번 뻗은 방향으로 계속 자라는 편이실 거예요.',
  fire: '안에 열이 많으신데 확 터뜨리기보다 조용히 오래 태우는 편이실 거예요.',
  earth: '한번 정한 건 웬만해선 안 바꾸시는 편일 거예요.',
  metal: '판단이 날카로운데 그게 잘 무뎌지지 않는 편이실 거예요.',
  water: '깊이 담아두는 쪽이라 속을 잘 안 드러내시는 편일 거예요.',
};

function closingLine(topEl: ElementKey, botEl: ElementKey): string {
  if (topEl === botEl) return SAME_CLOSING[topEl];
  if (SHENG[botEl] === topEl) return '아래에서 받쳐주는 힘이 있어 쌓은 게 잘 흩어지지 않는 편이실 거예요.';
  if (SHENG[topEl] === botEl) return '한번 마음이 붙으면 그게 오래 가는 편이실 거예요.';
  if (KE[topEl] === botEl) return '겉으로는 부드러운데 정작 본인 기준은 잘 안 굽히는 편이실 거예요.';
  return '스스로를 깎아가며 다듬는 편이라, 결과물이 단단하게 나오는 쪽이실 거예요.';
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('사용법: npx tsx scripts/spirit-reply.ts YYYY-MM-DD[:시][:L] ...');
  process.exit(1);
}

/** 마지막 글자에 받침이 있는지 (한글만 판정, 아니면 false) */
function hasBatchim(word: string): boolean {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}

/** 조사 선택 — 받침 있으면 first, 없으면 second (예: josa(name, '이', '가')) */
function josa(word: string, withBatchim: string, without: string): string {
  return hasBatchim(word) ? withBatchim : without;
}

/** 등급별 리플 꼬리말 — 일반은 등급 언급 없음 */
const TAIL: Record<string, string> = {
  일반: '',
  희귀: '\n\n희귀 등급이에요 ⭐⭐ 넷 중 하나꼴로 나오는 결이고요.',
  영물: '\n\n영물 등급이에요 ⭐⭐⭐ 열 명 중 한 명꼴이라 꽤 귀해요.',
  전설: '\n\n전설 등급이에요 ⭐⭐⭐⭐ 백 명 중 일곱 명! 오늘 처음 나왔을지도 몰라요.',
};

for (const raw of args) {
  const parts = raw.split(':');
  const dateStr = parts[0];
  const lunar = parts.some((p) => p.toUpperCase() === 'L');
  const hourPart = parts.slice(1).find((p) => /^\d{1,2}$/.test(p));
  const hour = hourPart !== undefined ? Number(hourPart) : undefined;

  const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) {
    console.log(`❌ 형식 오류: ${raw}`);
    continue;
  }
  const [, y, mo, d] = m;

  try {
    const myeongsik = computeMyeongsik({
      year: Number(y), month: Number(mo), day: Number(d),
      calendar: lunar ? 'lunar' : 'solar',
      hour, minute: 0, gender: 'male', name: '님',
    });
    const s = spiritFromMyeongsik(myeongsik);
    const stars = '★'.repeat(s.rarity.stars) + '☆'.repeat(4 - s.rarity.stars);

    console.log(`\n━━━ ${raw} ━━━`);
    console.log(`${s.name} · ${stars} ${s.rarity.ko} (${s.rarity.pct}) · ${s.formula}`);
    console.log('─── 리플 (복붙용) ───');

    const stem = myeongsik.ilju?.[0] ?? myeongsik.pillars?.[2]?.top?.c ?? '';
    const branch = myeongsik.ilju?.[1] ?? myeongsik.pillars?.[2]?.bot?.c ?? '';
    const ilju = `${STEM_KO[stem] ?? ''}${BRANCH_KO[branch] ?? ''}`;
    const dateLabel = `${String(y).slice(2)}.${String(mo).padStart(2, '0')}.${String(d).padStart(2, '0')}${lunar ? ' 음력' : ''}`;

    const topEl = s.elemKey;
    const botEl = ZODIAC[s.zodKey].elem as ElementKey;

    console.log(`${dateLabel}이면 ${ilju}일주, ${s.name}${josa(s.name, '이', '가')} 나오네요.` +
      (s.rarity.ko === '일반' ? ' 등급은 일반입니다.' : ''));
    console.log('');
    console.log(gradeLine(s.rarity.ko, ilju, s.name));
    console.log('');
    console.log(`${s.line}${josa(s.line, '은', '는')} ${s.elem.vibe}, ${s.animal}${josa(s.animal, '은', '는')} ${s.zod.trait} 결이고요.`);
    console.log(`${relationLine(topEl, botEl)}\n${closingLine(topEl, botEl)}`);
  } catch (e) {
    console.log(`❌ ${raw} — 계산 실패: ${String(e).slice(0, 80)}`);
  }
}
