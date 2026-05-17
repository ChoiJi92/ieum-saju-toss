import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import type { Myeongsik } from './saju';

/**
 * 직업운 — 본인 사주 기반.
 *
 * 명리 룰:
 *   - 십성 분포 → 적성 도출
 *     식상(식신·상관) = 창작·표현·기획·디자인·콘텐츠
 *     재성(정재·편재) = 영업·사업·금융·자산관리
 *     관성(정관·편관) = 조직·공직·관리·법무·군경
 *     인성(정인·편인) = 학문·연구·교육·심리
 *     비겁(비견·겁재) = 협업·경쟁·스포츠·동료
 *   - 일간 오행 → 직업 결
 *     木(甲乙) = 교육·기획·성장
 *     火(丙丁) = 표현·미디어·예술
 *     土(戊己) = 부동산·중개·관리
 *     金(庚辛) = 금융·법무·의학
 *     水(壬癸) = IT·유통·언론
 *
 * 4 axis: 창작·표현 / 사업·재물 / 조직 적합 / 학습·연구
 */

function variance(seed: string, key: string, range = 3): number {
  let h = 0;
  const s = seed + key;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % (range * 2 + 1)) - range;
}
function myeongsikSeed(m: Myeongsik): string {
  return m.pillars.map((p) => p.top.c + p.bot.c).join('');
}

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const isStem = (s: string): s is Stem => (STEMS as string[]).includes(s);

type Ohaeng = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
const ILGAN_OHAENG: Record<Stem, Ohaeng> = {
  甲: 'wood',  乙: 'wood',
  丙: 'fire',  丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
};

/** 십성 dominant 별 어울리는 직업 Top 3 + 피해야 할 환경 + 어울리는 환경 */
const JOB_BY_SIPSUNG: Record<
  Sipsung,
  {
    jobs: Array<{ name: string; sub: string }>;
    avoid: string;
    fit: string;
  }
> = {
  비견: {
    jobs: [
      { name: '스포츠·팀 코치', sub: '동료와 결을 맞추는 자리' },
      { name: '협업 IT 개발', sub: '팀 시너지가 결과로' },
      { name: '함께 가는 영업', sub: '믿음 기반 거래' },
    ],
    avoid: '혼자 모든 책임을 지는 1인 기업·고립된 환경에서는 동력을 잃어요.',
    fit: '동료와 함께 가는 자리에서 빛나는 결',
  },
  겁재: {
    jobs: [
      { name: '경쟁 영업·세일즈', sub: '실적이 곧 보상' },
      { name: '스포츠·자영업', sub: '도전이 동력' },
      { name: '창업·사업가', sub: '경쟁이 무대' },
    ],
    avoid: '평가가 모호하고 단조로운 환경에서는 의욕이 사라져요.',
    fit: '경쟁·도전이 뚜렷한 자리',
  },
  식신: {
    jobs: [
      { name: '요리·식음료', sub: '맛으로 표현하는 자리' },
      { name: '콘텐츠 크리에이터', sub: '자연스러운 매력 무기' },
      { name: '서비스·접객', sub: '편안함을 주는 결' },
    ],
    avoid: '엄격한 매뉴얼·반복 업무 환경에서는 답답해져요.',
    fit: '자유롭게 표현하고 즐길 수 있는 자리',
  },
  상관: {
    jobs: [
      { name: '크리에이티브 디렉터', sub: '발상이 자산' },
      { name: '작가·기획자', sub: '관점이 무기' },
      { name: '강사·발표자', sub: '재치가 빛나요' },
    ],
    avoid: '권위·전통적인 위계가 강한 조직에서는 가시처럼 박혀요.',
    fit: '자유로운 창작·기획·아이디어 자리',
  },
  정재: {
    jobs: [
      { name: '재무·회계', sub: '꼼꼼함이 경쟁력' },
      { name: '은행·금융', sub: '안정 운영의 결' },
      { name: '자산·세무 관리', sub: '쌓는 일에 강점' },
    ],
    avoid: '결과 예측이 어려운 도박성·고변동 자리에서는 흔들려요.',
    fit: '꾸준히 쌓고 관리하는 안정적인 자리',
  },
  편재: {
    jobs: [
      { name: '사업·창업', sub: '기회 포착의 결' },
      { name: '영업·세일즈', sub: '활동량이 곧 실적' },
      { name: '투자·트레이더', sub: '흐름 읽는 감각' },
    ],
    avoid: '한 자리에 오래 앉아 있는 정적 사무직에서는 답답해져요.',
    fit: '활동적으로 움직이며 돈을 다루는 자리',
  },
  정관: {
    jobs: [
      { name: '공무원·공기업', sub: '체계 안정의 결' },
      { name: '관리자·임원', sub: '신뢰가 무기' },
      { name: '법무·행정', sub: '약속을 지키는 일' },
    ],
    avoid: '체계 없는 자유분방한 환경에서는 흐트러져요.',
    fit: '체계와 책임이 뚜렷한 조직 자리',
  },
  편관: {
    jobs: [
      { name: '군·경찰·검찰', sub: '결단력이 무기' },
      { name: '의사·외과', sub: '정면 돌파의 결' },
      { name: '경영·CEO', sub: '큰 결정 내리는 자리' },
    ],
    avoid: '결정권 없이 시키는 일만 하는 자리에서는 답답해져요.',
    fit: '결단력으로 돌파하는 자리',
  },
  정인: {
    jobs: [
      { name: '교사·교수', sub: '가르치는 자리' },
      { name: '연구원·작가', sub: '깊이 파는 일' },
      { name: '상담사·심리', sub: '정서 케어의 결' },
    ],
    avoid: '빠른 의사결정·매일 변하는 환경에서는 피곤해져요.',
    fit: '깊이 있게 배우고 가르치는 자리',
  },
  편인: {
    jobs: [
      { name: '예술·디자이너', sub: '직관·영감의 결' },
      { name: '심리·점성·종교', sub: '깊은 통찰의 자리' },
      { name: '연구·기획', sub: '독창성이 무기' },
    ],
    avoid: '실증·반복·표준화된 업무에서는 직관이 막혀요.',
    fit: '창의·직관이 살아나는 자유로운 자리',
  },
};

/** 일간별 직업 결 풀이 (4~5줄) */
const CAREER_BODY_BY_ILGAN: Record<Stem, string> = {
  甲: '큰 나무처럼 성장 욕구가 강하고 리더십이 자연스러운 타입이에요. 처음부터 끝까지 본인이 끌고 가는 일에 강점이 있어요. 교육·기획·창업·관리자 자리에 잘 어울려요. 단 너무 자기 방향만 보다 협업이 막힐 수 있으니 옆에 유연한 사람을 두면 균형이 잡혀요.',
  乙: '바람에 부드럽게 휘는 풀처럼 유연하고 세심한 타입이에요. 큰 줄기보다 디테일을 챙기는 자리에서 빛나요. 디자인·기획·인사·상담·중간 관리자 자리에 잘 어울려요. 강한 사람 옆에서 조력자로 빛나는 자리도 본인 결에 잘 맞아요.',
  丙: '한낮의 태양처럼 표현력과 영향력이 큰 타입이에요. 사람 앞에 서서 빛나는 자리에 강해요. 발표·강의·미디어·영업·마케팅·연예 자리에 잘 어울려요. 단 감정 기복이 클 수 있으니 꾸준한 루틴을 의식적으로 챙겨주세요.',
  丁: '촛불·별의 빛처럼 안에서 깊게 빛나는 타입이에요. 한 분야를 깊게 파고드는 일에 강해요. 작가·연구원·디자이너·예술·심리상담 자리에 잘 어울려요. 직관이 뛰어나니 직관을 따라가는 결정이 의외로 잘 맞아요.',
  戊: '큰 산처럼 묵직하고 신뢰감 있는 타입이에요. 흔들리지 않는 안정감이 무기예요. 부동산·건설·중개·자산관리·관리자 자리에 잘 어울려요. 단 너무 무거우면 변화에 둔할 수 있으니 새로운 시도도 가끔 챙겨주세요.',
  己: '비옥한 들판처럼 포용력이 큰 타입이에요. 사람을 키우고 모이게 하는 자질이 있어요. 교육·인사·서비스·요식업·중개 자리에 잘 어울려요. 어머니 같은 따뜻함이 무기지만, 경계는 명확히 그어두는 게 진짜 베푸는 사람이 되는 길이에요.',
  庚: '강철·도끼처럼 결단력이 강한 타입이에요. 옳고 그름이 분명한 일에 강해요. 군·경찰·법무·외과·금융·CEO 자리에 잘 어울려요. 단 직선적이면 사람을 다치게 할 수 있으니 톤은 한 박자 부드럽게 가져가주세요.',
  辛: '하얀 보석·잘 닦인 칼처럼 섬세하고 완벽주의적인 타입이에요. 디테일을 보는 눈이 뛰어나요. 의학·법무·회계·디자이너·전문직 자리에 잘 어울려요. "완벽이 아닌 완료"를 키워드로 가져가면 시작이 빨라져요.',
  壬: '큰 강·바다처럼 흐름을 읽는 자유로운 타입이에요. 다양한 사람·정보 사이를 오가는 일에 강해요. IT·유통·언론·교통·무역 자리에 잘 어울려요. 단 너무 흐르다 자기 자리를 놓칠 수 있으니, 방향성을 정해주는 사람과 함께면 시너지가 폭발해요.',
  癸: '이슬비·맑은 샘물처럼 차분하고 꾸준한 타입이에요. 조용히 스며드는 영향력이 있어요. 연구·기획·상담·금융·바이오 자리에 잘 어울려요. 가끔 자기 목소리를 내는 자리를 만들어주면 존재감이 더 커져요.',
};

/** 십성별 커리어 팁 3개 (아코디언) */
const CAREER_TIPS: Record<
  Sipsung,
  Array<{ ic: string; lbl: string; sub: string; detail: string }>
> = {
  비견: [
    { ic: '🤝', lbl: '협업 환경 찾기', sub: '혼자 X, 함께 OK',
      detail: '비견 사주는 혼자 일할 때보다 동료와 함께 갈 때 두 배로 풀려요. 1인 기업·프리랜서보다는 팀 단위 환경을 우선으로 두세요. 동료 한 명과의 신뢰가 다음 커리어 점프의 발판이 돼요.' },
    { ic: '📋', lbl: '책임 분배 명확', sub: '모호하면 갈등',
      detail: '협업이 잘 풀리려면 누가 뭘 맡을지 처음부터 문서로 명확히 해두세요. 비견은 같은 결의 사람들과 잘 맞는 만큼 책임이 모호하면 부딪침도 빨라요. 작은 프로젝트일수록 더 명확히.' },
    { ic: '🌐', lbl: '인맥 자산화', sub: '동료가 곧 네트워크',
      detail: '같이 일했던 동료·선후배 관계를 꾸준히 챙겨주세요. 비견 사주는 인맥 자체가 가장 큰 커리어 자산이에요. 분기에 한 번 안부·식사 정도면 충분 — 작은 연결이 큰 기회를 가져와요.' },
  ],
  겁재: [
    { ic: '🔥', lbl: '경쟁 자리 선택', sub: '도전이 동력',
      detail: '겁재 사주는 평가·경쟁이 뚜렷한 환경에서 실력이 폭발해요. 평가 기준이 모호한 자리는 동력을 잃기 쉬워요. 영업·세일즈·콘테스트·창업 같은 결과가 즉시 보이는 자리를 우선으로.' },
    { ic: '🧘', lbl: '자존심 관리', sub: '이기되 사람 잃지 말기',
      detail: '경쟁심이 강한 만큼 결과는 좋아도 인간관계에 흠집을 남기기 쉬워요. 이긴 후에 함께 축하하는 여유가 진짜 실력이에요. 자존심 싸움은 단기 승리, 장기 손해.' },
    { ic: '💰', lbl: '재무 분리', sub: '회사 돈 ≠ 내 돈',
      detail: '겁재는 충동·과욕이 강해서 회사 돈·공금을 자기 돈처럼 쓸 위험이 있어요. 명확하게 분리하고 영수증·서류를 꼼꼼히. 한 번의 실수가 평판에 큰 흠집을 남겨요.' },
  ],
  식신: [
    { ic: '✨', lbl: '본인 색 살리기', sub: '꾸미지 말기',
      detail: '식신은 자연스러운 본인 모습이 가장 큰 매력이에요. 과하게 포장하거나 다른 사람 흉내 내려 하지 마세요. 좋아하는 분야·자기 톤·자연스러운 표현이 그대로 차별화 포인트가 돼요.' },
    { ic: '📝', lbl: '기록·아카이브', sub: '작은 결과물도 남기기',
      detail: '식신 사주는 작은 결과물도 꾸준히 기록·아카이브하면 한 해 후 큰 포트폴리오가 돼요. SNS·블로그·노션·깃허브 — 어디든 한 곳에 모아두세요. "올린 적 없는 작품"은 없는 것과 같아요.' },
    { ic: '🎨', lbl: '취미 수익화', sub: '부업이 본업으로',
      detail: '잘 하는 취미·관심사를 작게 수익화해보세요. 식신은 좋아하는 것에서 시작한 일이 본업으로 이어지는 흐름이 강해요. 처음엔 부업으로, 반응 좋으면 본업으로 — 이 순서가 가장 안전.' },
  ],
  상관: [
    { ic: '💡', lbl: '아이디어 자산화', sub: '메모가 시드',
      detail: '상관은 발상이 평소보다 또렷한 시기에 뻗어 나가요. 샤워·산책 중 떠오른 아이디어를 한 줄이라도 메모해두세요. 메모 없이 흘려보내면 끝, 적어두면 한 달 후 자산이 돼요.' },
    { ic: '🎤', lbl: '톤 조절', sub: '직설은 가시',
      detail: '상관 사주는 옳은 말이라도 직설적으로 던지면 가시처럼 박혀요. "이건 이상해" 대신 "이렇게 해보면 어때?"로. 같은 내용도 매력으로 들려요. 권위 있는 자리에선 발언 타이밍을 한 박자 늦춰주세요.' },
    { ic: '🆓', lbl: '자유로운 환경', sub: '위계 강한 곳 X',
      detail: '권위·전통적인 위계가 강한 조직에서는 "튀는 사람"으로 비치기 쉬워요. 자유롭게 의견 낼 수 있는 환경·수평적 조직·창업·프리랜서 자리가 결에 잘 맞아요.' },
  ],
  정재: [
    { ic: '📊', lbl: '디테일 챙기기', sub: '꼼꼼함이 무기',
      detail: '정재는 디테일·정확성·꾸준함이 그대로 신뢰로 쌓여요. 숫자·문서·일정 — 작은 부분까지 챙기는 자체가 평가로 돌아와요. "이 사람한테 맡기면 빠지는 게 없어" 신호를 만들어주세요.' },
    { ic: '🏦', lbl: '안정성 우선', sub: '도박성 자리 X',
      detail: '결과 예측이 어려운 고변동·도박성 자리는 결에 안 맞아요. 코인·단타 트레이딩·도박성 사업보단 은행·재무·자산관리·세무·회계 같은 안정 영역에서 진짜 실력이 발휘돼요.' },
    { ic: '📈', lbl: '장기 적립', sub: '꾸준함이 답',
      detail: '커리어도 자산도 한 번에 큰 점프보단 매일 조금씩 쌓는 흐름이 답이에요. 매달 새로운 작은 결과·자격증·인증·작은 적금 — 차곡차곡 쌓이는 자체가 정재 사주의 가장 큰 무기.' },
  ],
  편재: [
    { ic: '🎯', lbl: '활동량 ↑', sub: '외근·미팅·네트워크',
      detail: '편재는 사무실에 앉아 있을 때보다 외부에서 움직일 때 운이 와요. 미팅·외근·콘퍼런스·새 동네·낯선 자리 — 활동량 자체가 곧 실적이에요. 한 자리에만 있으면 운 절반을 놓쳐요.' },
    { ic: '💼', lbl: '거래·영업', sub: '돈 다루는 자리',
      detail: '편재 사주는 돈을 직접 다루는 자리에서 진짜 빛나요. 영업·세일즈·트레이딩·사업·중개 — 결과가 숫자로 즉시 보이는 환경. 정적인 사무직보다 활동적인 자리를 우선으로.' },
    { ic: '🌐', lbl: '오랜 인맥 가동', sub: '의외의 기회',
      detail: '한동안 연락 못 한 사람한테 안부 메시지 한 번 보내주세요. 편재는 오랜 인맥에서 의외의 거래·일·기회가 들어와요. 짧은 인사 한 줄이 다음 분기 큰 거래로 이어질 수 있어요.' },
  ],
  정관: [
    { ic: '💼', lbl: '체계·약속 챙기기', sub: '신뢰가 자산',
      detail: '정관은 작은 약속·일정·마감을 잘 지키는 자체가 그대로 운이에요. 화려한 트릭보다 묵묵한 신뢰가 빛나요. 윗사람·고객·평가자에게 꾸준히 약속 지키면 평가가 자연스럽게 따라와요.' },
    { ic: '📋', lbl: '문서·서류 정리', sub: '작은 정리가 큰 효과',
      detail: '계약서·메일·회의록·영수증 — 서류를 깔끔하게 정리하는 습관이 가장 큰 무기예요. 정관 사주는 정리된 사람·체계 잡힌 사람으로 보일 때 신뢰가 쌓이고, 그 신뢰가 곧 승진·계약으로 이어져요.' },
    { ic: '😴', lbl: '번아웃 방지', sub: '잠이 곧 자본',
      detail: '책임감이 강해서 무리하기 쉬워요. 잠 줄이면서 일하는 건 절대 X — 잠이 곧 다음 날 신뢰의 자본이에요. 1시간에 한 번 5분 스트레칭, 7시간 수면 룰을 지켜주세요.' },
  ],
  편관: [
    { ic: '⚡', lbl: '결단력 발휘', sub: '큰 결정 자리',
      detail: '편관은 시키는 일만 하는 자리에선 답답해져요. 결정권이 있는 자리·돌파해야 하는 자리·위기 관리 자리에서 진짜 실력이 발휘돼요. 책임이 무거울수록 더 빛나는 사주.' },
    { ic: '🛡️', lbl: '평정심 챙기기', sub: '압박 ↑ 환경',
      detail: '편관 사주는 압박·과제가 평소보다 많은 환경에 강하지만 에너지 소진도 빨라요. 명상·산책·잠·휴식 — 회복 시간을 의식적으로 챙겨주세요. 잘 쉬는 게 곧 다음 결단력의 연료.' },
    { ic: '🎯', lbl: '도전적 목표', sub: '안전 자리 X',
      detail: '안정적이고 평이한 자리는 편관의 결을 살리지 못해요. 의사·법조·군경·CEO·창업 — 결정과 책임이 뚜렷한 자리에서 진짜 본인이 나와요. 평범한 자리에 있으면 답답해서 다 놓치게 돼요.' },
  ],
  정인: [
    { ic: '📚', lbl: '평생 학습', sub: '배움이 자산',
      detail: '정인 사주는 자기계발 투자가 가장 큰 커리어 자산이에요. 강의·책·세미나·자격증 — 매년 한 가지씩 배운다는 마음으로 가주세요. 배운 만큼 다음 분기 수익으로 돌아오는 흐름.' },
    { ic: '☕', lbl: '멘토 만나기', sub: '조언이 시간 절약',
      detail: '선배·멘토·전문가에게 차 한 잔 청해서 조언을 구해주세요. "이거 어떻게 하셨어요?" 질문 한 번이 한 시간 시행착오를 줄여줘요. 정인은 좋은 멘토 한 명이 평생 자산이 되는 사주.' },
    { ic: '✍️', lbl: '글로 정리', sub: '쓰는 자체가 공부',
      detail: '배운 것·생각·관찰을 글로 정리하는 습관을 만들어주세요. 블로그·노션·일기 — 어디든 OK. 정인은 쓰는 자체가 깊어지는 흐름이라, 한 해 글이 그대로 본인의 전문성이 돼요.' },
  ],
  편인: [
    { ic: '🌙', lbl: '직관 따라가기', sub: '느낌이 답',
      detail: '편인은 분석·논리보다 직관이 더 정확한 시기가 자주 와요. "왠지 이쪽" 같은 느낌을 한 번 따라가보세요. 단 큰 결정·큰 돈은 X — 작은 선택만 직관으로 가주세요.' },
    { ic: '🎨', lbl: '독창성 살리기', sub: '표준화 X',
      detail: '편인 사주는 표준화·매뉴얼·반복 업무에서는 직관이 막혀요. 본인만의 색·관점·독창성이 통하는 자리에서 진짜 실력이 나와요. 예술·디자인·연구·기획·심리 — 자유로운 자리.' },
    { ic: '⏸️', lbl: '큰 결정 미루기', sub: '일주일 뒤 다시',
      detail: '이직·계약·창업 같은 큰 결정은 일단 일주일 미뤄주세요. 편인 달은 직관 ↑이지만 분석 ↓이라 큰 결정이 위험할 수 있어요. 일주일 뒤에도 좋아 보이면 그때 결정해도 늦지 않아요.' },
  ],
};

const STRENGTH_KEYWORDS: Record<Sipsung, [string, string, string]> = {
  비견: ['#팀워크', '#협업', '#신뢰'],
  겁재: ['#승부욕', '#추진력', '#독립'],
  식신: ['#표현력', '#자연스러움', '#친화'],
  상관: ['#창의', '#재치', '#기획'],
  정재: ['#꼼꼼함', '#안정', '#책임'],
  편재: ['#활동력', '#감각', '#네트워크'],
  정관: ['#신뢰', '#책임', '#정공법'],
  편관: ['#결단력', '#카리스마', '#돌파'],
  정인: ['#학습', '#깊이', '#정리'],
  편인: ['#직관', '#독창', '#영감'],
};

export type CareerForecast = {
  /** 종합 직업운 점수 */
  score: number;
  mood: string;
  tagline: string;
  /** 일간별 직업 결 (4~5줄) */
  body: string;
  /** 4 axis */
  axes: Array<{ ic: string; lbl: string; score: number; color: string; oneLine: string }>;
  /** 어울리는 직업 Top 3 */
  jobs: Array<{ name: string; sub: string }>;
  /** 어울리는 환경 한 줄 */
  fit: string;
  /** 피해야 할 환경 한 줄 */
  avoid: string;
  /** 강점 키워드 3개 */
  keywords: [string, string, string];
  /** 이번 달 직장 흐름 (1~2줄) */
  monthFlow: string;
  /** 커리어 팁 3개 (아코디언) */
  tips: Array<{ ic: string; lbl: string; sub: string; detail: string }>;
};

const MONTH_FLOW_BY_SIPSUNG: Record<Sipsung, string> = {
  비견: '이번 달은 협업·동료와 함께 가는 흐름이 강해요. 새 시작보단 기존 팀과의 신뢰를 다지는 시기예요.',
  겁재: '이번 달은 경쟁·도전 자리가 평소보다 많아요. 정면으로 부딪쳐 실력 증명하기 좋은 시기예요.',
  식신: '이번 달은 표현·매력이 자연스럽게 빛나는 시기예요. 발표·기획·콘텐츠 작업이 평소보다 잘 통해요.',
  상관: '이번 달은 새 발상·아이디어가 평소 두 배로 또렷한 시기예요. 부업·사이드 프로젝트 검토에 좋아요.',
  정재: '이번 달은 꾸준히 쌓는 흐름이 답이에요. 새 시도보단 기존 일 마무리·정리·계약 갱신에 집중하기 좋아요.',
  편재: '이번 달은 외부 미팅·거래·네트워킹이 평소보다 잘 풀려요. 활동량 ↑이 곧 실적으로 돌아와요.',
  정관: '이번 달은 윗사람·고객에게 인정받기 좋은 흐름이에요. 정공법·약속한 것 그대로 실행하면 평가가 따라와요.',
  편관: '이번 달은 압박·과제가 평소보다 많지만 정면 돌파하면 한 단계 성장하는 시기예요. 큰 결정 내리기 좋은 타이밍.',
  정인: '이번 달은 배우고 정리하는 흐름이 답이에요. 큰 도약보단 내공 쌓기·자료 정리·멘토 미팅에 집중하기 좋아요.',
  편인: '이번 달은 직관·영감이 살아나는 시기예요. 창작·기획 작업에 좋고, 큰 계약은 일주일 미뤄주세요.',
};

function fieldOneLine(kind: 'create' | 'biz' | 'org' | 'study', score: number): string {
  const tier = score >= 85 ? 'high' : score >= 75 ? 'mid' : score >= 65 ? 'low' : 'warn';
  if (kind === 'create')
    return tier === 'high' ? '발상·표현이 강점' : tier === 'mid' ? '꾸준한 표현력' : tier === 'low' ? '연습으로 채우기' : '내면 다지기 시기';
  if (kind === 'biz')
    return tier === 'high' ? '돈 흐름 감각 ↑' : tier === 'mid' ? '안정적 자산 감각' : tier === 'low' ? '학습·관찰 시기' : '큰 베팅 X';
  if (kind === 'org')
    return tier === 'high' ? '체계·신뢰 강점' : tier === 'mid' ? '협력 균형 좋음' : tier === 'low' ? '체계 적응 중' : '자유 자리 우선';
  return tier === 'high' ? '학습·연구 강점' : tier === 'mid' ? '꾸준히 쌓는 시기' : tier === 'low' ? '실전 함께' : '실행 우선';
}

export function careerForecast(myeongsik: Myeongsik, today: Date = new Date()): CareerForecast | null {
  const myIlgan = myeongsik.ilgan.c;
  if (!isStem(myIlgan)) return null;
  const seed = myeongsikSeed(myeongsik);

  // 명식 천간 4개 (일주 천간 = 본인 제외) → 십성 분포
  const sipsungCount: Partial<Record<Sipsung, number>> = {};
  myeongsik.pillars.forEach((p, i) => {
    if (i === 2) return;
    const t = p.top.c;
    if (isStem(t)) {
      const sip = getSipsung(myIlgan, t);
      sipsungCount[sip] = (sipsungCount[sip] ?? 0) + 1;
    }
  });

  const has = (sip: Sipsung) => (sipsungCount[sip] ?? 0) > 0;
  const ilganOhaeng = ILGAN_OHAENG[myIlgan];

  // 4 axis 점수
  const baseCreate =
    60 + (has('식신') ? 12 : 0) + (has('상관') ? 10 : 0) +
    (ilganOhaeng === 'fire' ? 5 : 0) + (ilganOhaeng === 'water' ? 5 : 0);
  const baseBiz =
    60 + (has('정재') ? 10 : 0) + (has('편재') ? 12 : 0) -
    (has('비견') ? 4 : 0) - (has('겁재') ? 4 : 0);
  const baseOrg =
    60 + (has('정관') ? 12 : 0) + (has('편관') ? 8 : 0) +
    (has('정인') ? 5 : 0) + (has('편인') ? 3 : 0);
  const baseStudy =
    60 + (has('정인') ? 12 : 0) + (has('편인') ? 10 : 0) +
    (ilganOhaeng === 'wood' ? 5 : 0) + (ilganOhaeng === 'metal' ? 5 : 0);

  const adjust = (key: string, v: number) =>
    Math.max(50, Math.min(98, v + variance(seed, key, 3)));

  const create = adjust('create', baseCreate);
  const biz    = adjust('biz',    baseBiz);
  const org    = adjust('org',    baseOrg);
  const study  = adjust('study',  baseStudy);
  const overall = Math.round((create + biz + org + study) / 4);

  // dominant 십성 — body/jobs/tips 기반
  const dominant = (Object.entries(sipsungCount) as Array<[Sipsung, number]>).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] ?? '식신';

  const jobInfo = JOB_BY_SIPSUNG[dominant];

  // 이번 달 월주 십성 → 이번 달 직장 흐름
  const r = calculateSaju(today.getFullYear(), today.getMonth() + 1, 15, 12, 0, {
    applyTimeCorrection: false,
  });
  const mStem = r.monthPillarHanja[0];
  const monthSipsung: Sipsung = isStem(mStem) ? getSipsung(myIlgan, mStem) : dominant;

  const moodMap: Record<Sipsung, string> = {
    비견: '협업 결',  겁재: '경쟁 결',
    식신: '표현 결',  상관: '창의 결',
    정재: '안정 결',  편재: '활동 결',
    정관: '신뢰 결',  편관: '결단 결',
    정인: '학습 결',  편인: '직관 결',
  };

  const tagline =
    overall >= 85 ? '본업 결이 또렷하고 흐름이 좋아요'
    : overall >= 75 ? '안정적이고 꾸준히 쌓는 흐름'
    : overall >= 65 ? '내공을 다지는 시기'
    : '한 박자 쉬어가는 시기';

  return {
    score: overall,
    mood: moodMap[dominant],
    tagline,
    body: CAREER_BODY_BY_ILGAN[myIlgan],
    axes: [
      { ic: '🎨', lbl: '창작·표현', score: create, color: '#FF8B6C', oneLine: fieldOneLine('create', create) },
      { ic: '💼', lbl: '사업·재물', score: biz,    color: '#3DC795', oneLine: fieldOneLine('biz',    biz)    },
      { ic: '🏛️', lbl: '조직 적합', score: org,    color: '#4A90E2', oneLine: fieldOneLine('org',    org)    },
      { ic: '📚', lbl: '학습·연구', score: study,  color: '#9D7BFF', oneLine: fieldOneLine('study',  study)  },
    ],
    jobs: jobInfo.jobs,
    fit: jobInfo.fit,
    avoid: jobInfo.avoid,
    keywords: STRENGTH_KEYWORDS[dominant],
    monthFlow: MONTH_FLOW_BY_SIPSUNG[monthSipsung],
    tips: CAREER_TIPS[dominant],
  };
}
