import type { OhaengKey } from '../components/ie';
import type { Myeongsik } from './saju';

export type SpiritStage = 1 | 2 | 3 | 4;

export type SpiritProfile = {
  key: string;
  line: SpiritLine;
  animal: SpiritAnimal;
  stage: SpiritStage;
  name: string;
  lineLabel: string;
  animalLabel: string;
  stageLabel: string;
  elementLabel: string;
  imageSrc: string | null;
  unavailable: boolean;
};

type SpiritLine = '새싹' | '노을' | '언덕' | '달빛' | '이슬';
type SpiritAnimal =
  | '쥐'
  | '소'
  | '호랑이'
  | '토끼'
  | '용'
  | '뱀'
  | '말'
  | '양'
  | '원숭이'
  | '닭'
  | '개'
  | '돼지';

const LINE_BY_OHAENG: Record<OhaengKey, { line: SpiritLine; label: string }> = {
  wood: { line: '새싹', label: '목의 새싹' },
  fire: { line: '노을', label: '화의 노을' },
  earth: { line: '언덕', label: '토의 언덕' },
  metal: { line: '달빛', label: '금의 달빛' },
  water: { line: '이슬', label: '수의 이슬' },
};

const ANIMAL_BY_BRANCH: Record<string, SpiritAnimal> = {
  子: '쥐',
  丑: '소',
  寅: '호랑이',
  卯: '토끼',
  辰: '용',
  巳: '뱀',
  午: '말',
  未: '양',
  申: '원숭이',
  酉: '닭',
  戌: '개',
  亥: '돼지',
};

const STAGE_LABEL: Record<SpiritStage, string> = {
  1: '아기',
  2: '어린',
  3: '성체',
  4: '영험',
};

const AVAILABLE_LINES: Partial<Record<SpiritLine, SpiritAnimal[]>> = {
  새싹: ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'],
  노을: ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'],
  언덕: ['쥐'],
};

export function spiritFromMyeongsik(myeongsik: Myeongsik | null): SpiritProfile {
  const ilganOhaeng = myeongsik?.ilgan.ohaeng ?? 'wood';
  const yearBranch = myeongsik?.pillars[0]?.bot.c ?? '子';
  const lineMeta = LINE_BY_OHAENG[ilganOhaeng];
  const animal = ANIMAL_BY_BRANCH[yearBranch] ?? '쥐';
  const stage = resolveSpiritStage(myeongsik);
  const stageLabel = STAGE_LABEL[stage];
  const key = `${lineMeta.line}${animal}`;
  const available = AVAILABLE_LINES[lineMeta.line]?.includes(animal) ?? false;

  return {
    key,
    line: lineMeta.line,
    animal,
    stage,
    name: `${key}`,
    lineLabel: lineMeta.label,
    animalLabel: animal,
    stageLabel,
    elementLabel: lineMeta.label.split('의')[0],
    imageSrc: available ? `/spirits/${key}/${key}-${String(stage).padStart(2, '0')}-${stageLabel}.png` : null,
    unavailable: !available,
  };
}

function resolveSpiritStage(myeongsik: Myeongsik | null): SpiritStage {
  if (!myeongsik) return 1;
  const total = Object.values(myeongsik.ohaeng).reduce((sum, n) => sum + n, 0);
  const own = myeongsik.ohaeng[myeongsik.ilgan.ohaeng] ?? 0;
  const ratio = total > 0 ? own / total : 0;
  const gauge = myeongsik.shinkang.gauge;

  if (gauge >= 72 || ratio >= 0.38) return 4;
  if (gauge >= 54 || ratio >= 0.28) return 3;
  if (gauge >= 36 || ratio >= 0.18) return 2;
  return 1;
}
