import assert from 'node:assert/strict';
import { buildTodayActionGuide, buildMonthActionPlan } from '../src/lib/fortune-guides';

const sections = [
  { id: 'overall', label: '총운', score: 71 },
  { id: 'love', label: '연애운', score: 70 },
  { id: 'money', label: '재물운', score: 69 },
  { id: 'work', label: '직장운', score: 91 },
  { id: 'health', label: '건강운', score: 55 },
];

const todayA = buildTodayActionGuide({ sections, date: new Date('2026-05-20T12:00:00+09:00'), personalSeed: 'sample-user' });
const todayB = buildTodayActionGuide({ sections, date: new Date('2026-05-21T12:00:00+09:00'), personalSeed: 'sample-user' });

assert.notDeepEqual(
  {
    luckyTime: todayA.luckyTime,
    todayOneLine: todayA.todayOneLine,
    todayNoNo: todayA.todayNoNo,
    missions: todayA.missions,
    closingQuestion: todayA.closingQuestion,
  },
  {
    luckyTime: todayB.luckyTime,
    todayOneLine: todayB.todayOneLine,
    todayNoNo: todayB.todayNoNo,
    missions: todayB.missions,
    closingQuestion: todayB.closingQuestion,
  },
  'same top/low sections must still produce a different daily guide on another date'
);

const workTopMissionVariants = new Set(
  Array.from({ length: 14 }, (_, i) => {
    const d = new Date('2026-05-20T12:00:00+09:00');
    d.setDate(d.getDate() + i);
    const guide = buildTodayActionGuide({ sections, date: d, personalSeed: 'sample-user' });
    return `${guide?.missions.morning}|${guide?.missions.noon}|${guide?.missions.night}`;
  })
);

assert.ok(
  workTopMissionVariants.size >= 5,
  `work-top 3-step missions should use a broad cross-domain pool, got only ${workTopMissionVariants.size} variants`
);

assert.ok(
  Array.from(workTopMissionVariants).some((mission) => /물 한 컵|감사|지출|호흡|산책|표현|정리/.test(mission)),
  'work-top 3-step missions should sometimes include recovery/relationship/money/routine style missions, not only work wording'
);

const monthFields = [
  { lbl: '총운', score: 72 },
  { lbl: '일·커리어', score: 88 },
  { lbl: '연애', score: 70 },
  { lbl: '재물', score: 60 },
];

const monthA = buildMonthActionPlan({
  fields: monthFields,
  monthScore: 74,
  mood: '안정',
  tagline: '흐름',
  bestDay: 8,
  worstDay: 21,
  ym: '2026-05',
  personalSeed: 'sample-user',
});
const monthB = buildMonthActionPlan({
  fields: monthFields,
  monthScore: 74,
  mood: '안정',
  tagline: '흐름',
  bestDay: 8,
  worstDay: 21,
  ym: '2026-06',
  personalSeed: 'sample-user',
});

assert.notDeepEqual(
  { missions: monthA.missions, caution: monthA.caution, weekFocus: monthA.weekFocus, monthClosing: monthA.monthClosing },
  { missions: monthB.missions, caution: monthB.caution, weekFocus: monthB.weekFocus, monthClosing: monthB.monthClosing },
  'same monthly top/low fields must still produce a different plan on another month'
);

console.log('fortune guide variation checks passed');
