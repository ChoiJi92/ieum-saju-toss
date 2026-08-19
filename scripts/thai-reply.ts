/**
 * 스레드 리플 생성기 — 생년월일 → 태국 요일 판정 + 복붙용 리플 문구.
 *
 *   npx tsx scripts/thai-reply.ts 1992-05-13          # 시간 모름 (낮 기준)
 *   npx tsx scripts/thai-reply.ts 1992-05-13 21       # 21시 출생 (새벽 경계·라후 반영)
 *   npx tsx scripts/thai-reply.ts 1995-08-15 --lunar  # 음력 생일
 *
 * 출력: 판정 결과 + 첨부할 카드 파일 + 리플 문구(복붙용) + 되물음 필요 여부.
 * 톤 가이드: 해요체, AI 냄새 금지, 짧게. 궁합 한 줄로 친구 태그 유발.
 */
import { thaiBirthDay, THAI_DAYS, type ThaiDayKey } from '../src/lib/thai-astrology';

const REPLY: Record<ThaiDayKey, string> = {
  sun: `일요일생이시네요! 한낮 사자예요 ☀️ 태양의 신 수리야가 지키는 사람.
어디서든 눈에 띄는 타입인데, 속으론 "나 잘하고 있나" 오래 곱씹는 편이죠.
행운색은 빨강 — 목요일생이랑 잘 통해요.`,
  mon: `월요일생은 보름 사슴이에요 🌕 달의 신 찬드라의 사람.
지나가듯 한 말도 기억했다가 챙겨주는 타입이라 곁에 오래 남는 인연이 많죠.
대신 남의 감정을 스펀지처럼 흡수해서 지치기 쉬우니, 하루 한 번은 내 마음부터요.`,
  tue: `화요일생은 불꽃 여우예요 🔥 전사의 별 망갈라의 사람.
돌려 말하는 법이 없고 몸이 먼저 움직이는 타입. 근데 화나도 금방 풀리죠?
수요일 낮생이랑은 속도가 안 맞아서 티격태격할 수 있어요.`,
  wedDay: `수요일 낮이면 바람 앵무예요 🍃 지혜의 별 부다의 사람.
처음 보는 사람과도 10분이면 아는 사이처럼 대화하는 타입.
말은 많이 하는데 정작 마음 얘기는 잘 안 꺼내죠 — 월요일생이랑 특히 그래요.`,
  wedNight: `오… 수요일 밤이면 그믐 고양이예요 ✦ 여덟 중 가장 드문, 밤의 별 라후의 사람.
남들이 못 보는 걸 먼저 알아채는 직관형. 대신 힘든 걸 혼자 다 안고 가는 버릇이 있죠.
이 카드 받는 분, 정말 거의 없어요.`,
  thu: `목요일생은 고요 부엉이예요 🦉 스승의 별 구루의 사람.
나이와 상관없이 "선생님 같다"는 말 듣지 않으세요? 다들 조언 구하러 오는 타입.
바른말이 잔소리로 들릴 때만 조심 — 금요일생이랑 그 지점에서 부딪혀요.`,
  fri: `금요일생은 새벽 공작이에요 🦚 사랑의 별 슈크라(새벽별 금성)의 사람.
같이 있으면 기분 좋아진다는 말 많이 듣는 타입. 예쁜 걸 알아보는 눈이 재능이에요.
거절을 못 해서 내 시간이 남의 일로 채워지는 것만 조심.`,
  sat: `토요일생은 바위 거북이에요 🪨 인내의 별 샤니의 사람.
말수는 적어도 겪어본 사람은 다 알죠 — 제일 의리 있는 사람이라는 거.
남들이 포기하는 지점에서 한 걸음 더 가는 타입. 늦게 피는 꽃이 오래갑니다.`,
};

const args = process.argv.slice(2);
const dateArg = args[0];
const lunar = args.includes('--lunar');
const hourArg = args.find((a) => /^\d{1,2}$/.test(a));

if (!dateArg || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateArg)) {
  console.log('사용법: npx tsx scripts/thai-reply.ts YYYY-MM-DD [시(0~23)] [--lunar]');
  process.exit(1);
}
const [y, m, d] = dateArg.split('-').map(Number);
const hour = hourArg !== undefined ? Number(hourArg) : undefined;

const day = thaiBirthDay({ year: y, month: m, day: d, calendar: lunar ? 'lunar' : 'solar', hour });

console.log(`판정: ${day.weekdayKr} — ${day.deity.plain} ${day.deity.name}`);
console.log(`카드: teasers/${day.key}.png`);
console.log(`시간 반영: ${day.usedDawnRule ? '예 (새벽 6시 경계·라후 판정 적용)' : '아니오 (달력 요일 기준)'}`);

// 되물음 필요 케이스 안내
if (hour === undefined) {
  const civilDow = new Date(y, m - 1, d).getDay();
  if (civilDow === 3) {
    console.log('\n⚠️ 되물음 필요 — 수요일생: 밤(18시~새벽 6시) 출생이면 라후로 바뀜!');
    console.log('되물음: "수요일생이시네요! 혹시 몇 시쯤 태어나셨어요? 저녁~새벽이면 완전히 다른, 훨씬 드문 아이가 나와요 👀"');
  } else {
    console.log('\nℹ️ 새벽 6시 전 출생이면 전날 요일로 바뀜 — 리플 끝에 한 줄 안내 포함됨');
  }
}

console.log('\n─── 리플 (복붙용) ───');
let reply = REPLY[day.key];
if (hour === undefined && new Date(y, m - 1, d).getDay() !== 3) {
  reply += '\n(혹시 새벽 6시 전에 태어나셨으면 전날 요일로 바뀌어요!)';
}
console.log(reply);
