// 밝기 테이블 생성기 — iztro(zh-CN) 스윕으로 14주성 × 12지지 밝기를 수집해 TS 코드로 출력.
// 사용: npx tsx scripts/gen-jamidusu-brightness.ts → 출력 코드를 jamidusu-stars.ts에 붙여넣기.
// 근거: 묘왕리함표는 유파별 이표가 있어 손 전사 대신 iztro 테이블을 채택(전수 대조와 자기일관).
import { astro } from 'iztro';

const HANZI_TO_KR: Record<string, string> = { 庙: '묘', 旺: '왕', 得: '득', 利: '리', 平: '평', 不: '불', 陷: '함' };
const BRANCH_KR = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const BRANCH_OF: Record<string, number> = { 子: 0, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5, 午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11 };
const STARS = ['자미', '천기', '태양', '무곡', '천동', '염정', '천부', '태음', '탐랑', '거문', '천상', '천량', '칠살', '파군'];
// ZH_TO_KR은 zh-CN 간체 표기 (STAR_HANJA의 번체와 다름 — iztro zh-CN 로케일 출력 기준)
const ZH_TO_KR: Record<string, string> = { 紫微: '자미', 天机: '천기', 太阳: '태양', 武曲: '무곡', 天同: '천동', 廉贞: '염정', 天府: '천부', 太阴: '태음', 贪狼: '탐랑', 巨门: '거문', 天相: '천상', 天梁: '천량', 七杀: '칠살', 破军: '파군' };

const table: Record<string, (string | null)[]> = {};
for (const s of STARS) table[s] = Array(12).fill(null);
let filled = 0;
let skipped = 0;
outer: for (let y = 1950; y <= 2030; y++) {
  for (let m = 1; m <= 12; m++) {
    for (const d of [5, 15, 25]) {
      for (const h of [0, 3, 6, 9]) {
        let az; try { az = astro.bySolar(`${y}-${m}-${d}`, h, 'female', true, 'zh-CN'); } catch { skipped++; continue; }
        for (const p of az.palaces) {
          const b = BRANCH_OF[p.earthlyBranch];
          if (b === undefined) continue; // iztro 12지지는 BRANCH_OF가 전부 커버 — 여기 도달해도 filled<168 throw가 잡는다
          for (const st of p.majorStars) {
            const kr = ZH_TO_KR[st.name]; if (!kr || !st.brightness) continue;
            const v = HANZI_TO_KR[st.brightness];
            if (!v) throw new Error(`미지의 밝기: ${st.brightness}`);
            if (table[kr][b] === null) { table[kr][b] = v; filled++; }
            else if (table[kr][b] !== v) throw new Error(`밝기 모순: ${kr}@${BRANCH_KR[b]} ${table[kr][b]} vs ${v}`);
          }
        }
        if (filled === 14 * 12) break outer;
      }
    }
  }
}
if (filled !== 14 * 12) throw new Error(`커버 미달: ${filled}/168 (iztro 오류 스킵 ${skipped}건)`);
console.log('// 근거: iztro(zh-CN) 廟旺利陷 테이블 전수 추출 — scripts/gen-jamidusu-brightness.ts 로 재생성 가능');
console.log('export const BRIGHTNESS_TABLE: Record<MainStar, Brightness[]> = {');
for (const s of STARS) console.log(`  ${s}: [${table[s].map((v) => `'${v}'`).join(', ')}], // 자축인묘진사오미신유술해`);
console.log('};');
