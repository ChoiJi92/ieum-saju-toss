/** 리포트 목차 생성 확인 — npx tsx scripts/_test-outline.ts */
import { computeMyeongsik, type SajuInput } from '../src/lib/saju';
import { buildReportOutline } from '../src/lib/report-outline';

const cases: [string, SajuInput][] = [
  ['최지훈 1992-05-13 07시 남', { year: 1992, month: 5, day: 13, hour: 7, minute: 0, calendar: 'solar', gender: 'male', name: '최지훈' }],
  ['김예지 1994-09-30 09:11 여', { year: 1994, month: 9, day: 30, hour: 9, minute: 11, calendar: 'solar', gender: 'female', name: '김예지' }],
  ['시 모름 1988-11-03 여', { year: 1988, month: 11, day: 3, calendar: 'solar', gender: 'female', name: '테스트' }],
];

for (const [label, input] of cases) {
  const ms = computeMyeongsik(input);
  const o = buildReportOutline(ms, { year: input.year, gender: input.gender });
  console.log('━'.repeat(56));
  console.log(`■ ${label}`);
  console.log(`\n  「${o.headline}」\n`);
  for (const ch of o.chapters) {
    console.log(`  ${ch.no}장  ${ch.title}`);
    for (const it of ch.items) console.log(`       · ${it}`);
    console.log('');
  }
}
