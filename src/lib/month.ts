import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import type { Myeongsik } from './saju';
import { profileHint, pickBySeed, rotateBySeed } from './personalize';
import { buildPeriodLuckGuide, STEM_OHAENG, type LuckGuide } from './luck-guide';

/**
 * 이달의 운세 — 본인 일간 × 이번 달 월주 천간 → 십성 → 4분야 점수.
 * 이번 달 일별 일진(30~31일) → best/worst 날짜.
 * 키워드 3 + 행동 가이드 3 = 광고 1회 본 보상으로 적당한 분량.
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

/** 십성별 4분야 점수 (총운·일·연애·돈) */
export const SCORE: Record<Sipsung, { overall: number; work: number; love: number; money: number }> = {
  비견: { overall: 72, work: 78, love: 68, money: 65 },
  겁재: { overall: 65, work: 72, love: 60, money: 58 },
  식신: { overall: 84, work: 80, love: 88, money: 76 },
  상관: { overall: 78, work: 84, love: 72, money: 70 },
  정재: { overall: 80, work: 78, love: 76, money: 88 },
  편재: { overall: 82, work: 75, love: 78, money: 90 },
  정관: { overall: 75, work: 88, love: 78, money: 72 },
  편관: { overall: 68, work: 78, love: 65, money: 65 },
  정인: { overall: 78, work: 75, love: 72, money: 70 },
  편인: { overall: 72, work: 72, love: 75, money: 65 },
};

const MOOD: Record<Sipsung, string> = {
  비견: '협력의 달', 겁재: '경쟁의 달',
  식신: '꽃피는 달', 상관: '창의의 달',
  정재: '안정의 달', 편재: '기회의 달',
  정관: '책임의 달', 편관: '도전의 달',
  정인: '배움의 달', 편인: '직관의 달',
};

const TAGLINE: Record<Sipsung, string> = {
  비견: '함께할 사람이 늘어나는 달',
  겁재: '경쟁 속에서 단단해지는 달',
  식신: '하고 싶은 거 펼치는 달',
  상관: '새 아이디어가 빛나는 달',
  정재: '꾸준히 쌓이는 안정의 달',
  편재: '예상 못한 기회가 들어오는 달',
  정관: '책임이 보상으로 돌아오는 달',
  편관: '한 단계 성장하는 도전의 달',
  정인: '배우고 채우는 달',
  편인: '직관·영감이 빛나는 달',
};

const KEYWORDS: Record<Sipsung, [string, string, string]> = {
  비견: ['#팀워크', '#함께가기', '#협업'],
  겁재: ['#승부욕', '#한박자쉬기', '#충동주의'],
  식신: ['#표현', '#럭키비키', '#매력UP'],
  상관: ['#아이디어', '#새시도', '#톤조절'],
  정재: ['#안정', '#차곡차곡', '#적금'],
  편재: ['#기회', '#횡재신호', '#네트워크'],
  정관: ['#신뢰', '#정공법', '#약속'],
  편관: ['#정면돌파', '#성장', '#휴식필수'],
  정인: ['#배움', '#멘토', '#정리'],
  편인: ['#직관', '#영감', '#큰결정미루기'],
};

/** 십성별 한 달 흐름 풀이 — 3개 변형, 달이 바뀌면 다른 문장이 나와요 */
const MONTH_BODY: Record<Sipsung, string[]> = {
  비견: [
    '함께할 사람이 늘어나는 달이에요. 혼자 끌고 가던 일도 동료·친구의 손을 빌리면 두 배 가벼워져요. 사람 만나는 자체가 운이라 모임·공동 작업·팀 프로젝트에 적극 참여해주세요. 단 책임 분배는 처음부터 명확히 정해두세요.',
    '같은 결의 사람들과 손 잡으면 일이 술술 풀리는 달이에요. 혼자 고민하던 문제도 누군가에게 털어놓으면 의외로 쉽게 해결돼요. 모임이나 공동 작업에서 작은 역할이라도 맡아보세요. 나눌수록 운도 함께 커지는 시기예요.',
    '협력의 흐름이 강하게 들어오는 달이에요. 평소보다 연락이 늘거나 같이 일하자는 제안이 들어올 수 있어요. 거절하기보다 일단 만나고 얘기 들어보는 쪽이 운이 열려요. 단 역할과 기대치는 처음부터 맞춰두는 게 좋아요.',
  ],
  겁재: [
    '경쟁 에너지가 강한 달이에요. 라이벌·시험·면접·경쟁 자리에 강한 흐름이지만 충동·과욕도 함께 와요. 큰 결정·강한 발언은 한 박자 쉰 뒤에 다시 봐주세요. 큰 지출·도박은 이번 달엔 피해주세요.',
    '이기고 싶은 마음이 평소보다 강한 달이에요. 경쟁·도전 자리에선 좋은 에너지지만 일상에서는 충동이 될 수 있어요. 결정 전에 잠 한 번 자고 다시 보는 룰을 지켜주세요. 지갑 관리만 잘해도 이번 달 운이 살아나요.',
    '자신감이 넘치지만 과욕이 따라오기 쉬운 달이에요. 경쟁·시험에는 강한 흐름이니 도전 자리는 두드려보세요. 단 SNS 반응이나 사소한 말에 발끈하지 않게 한 박자 쉬어가는 연습이 필요해요. 큰 지출·충동 결제는 이번 달엔 특히 조심해주세요.',
  ],
  식신: [
    '하고 싶은 거 마음껏 펼치는 달이에요. 표현·창작·발표·매력 어필에 좋은 시기예요. 새로운 시도·이직·콘텐츠 제작을 검토하기 좋은 타이밍이에요. 즐기되 기록만 남겨두면 충분해요.',
    '좋아하는 것을 펼치면 운이 따라오는 달이에요. 오래 미뤄둔 취미나 새로운 도전을 가볍게 시작해보세요. 완벽하게 준비하기보다 일단 움직이는 게 이번 달 답이에요. 행복한 표정 자체가 이번 달 가장 큰 매력이에요.',
    '표현하고 드러낼수록 빛나는 달이에요. 평소 숨겨두던 재능이나 개성을 꺼내볼 좋은 타이밍이에요. 새 SNS 계정, 취미 공유, 작은 발표 자리 모두 지금 하기 좋아요. 즐기면서 기록까지 남기면 다음 달로 이어지는 운이 돼요.',
  ],
  상관: [
    '틀을 깨는 발상이 빛나는 달이에요. 평범하지 않은 길에서 본인만의 답을 찾는 시기예요. 부업·사이드 프로젝트·콘텐츠 수익화 검토가 좋아요. 단 직설적인 발언으로 사람 잃지 않게 톤은 한 번 더 신경 써주세요.',
    '아이디어가 평소보다 두 배 선명한 달이에요. 새로운 방식·새로운 루트를 찾는 흐름이라 기존 방식에 갇혀 있으면 운이 막혀요. 사이드 프로젝트나 부업 아이디어를 메모해두기 좋은 타이밍이에요. 옳은 말이라도 톤은 한 번 더 다듬어주세요.',
    '창의력이 터지는 달이에요. 머릿속 아이디어를 적어두기만 해도 다음 달 자산이 돼요. 익숙한 방식에서 벗어나 새로운 루트를 시도해보세요. 단 발산하는 에너지가 강해서 관계에서 톤이 날카로워지지 않게 주의가 필요해요.',
  ],
  정재: [
    '꾸준히 쌓이는 안정의 달이에요. 큰 변동 없이 계획대로 가면 그게 정답이에요. 적금·예금·계약 갱신 점검에 좋은 시기예요. 새 모험보단 어제 약속한 것 마무리에 집중해주세요.',
    '안정적으로 쌓이는 흐름이 강한 달이에요. 화려한 도약보다 꾸준함이 빛나는 시기예요. 이미 진행 중인 일을 마무리하고 약속을 착착 지켜가면 신뢰와 결과가 함께 따라와요. 적금 하나 추가하거나 고정비 정리하기 딱 좋은 타이밍이에요.',
    '작은 것들이 차곡차곡 쌓이는 달이에요. 새 시작보다는 기존에 해오던 것을 마무리 짓는 흐름이에요. 약속 지키기·서류 정리·계약 갱신처럼 소소해 보이는 일들이 나중에 큰 안정으로 돌아와요. 지금은 묵묵히 가는 게 정답이에요.',
  ],
  편재: [
    '예상 못한 기회·만남이 들어오는 달이에요. 안전한 자리에만 있으면 운 절반을 놓치니 새로운 자리·사람을 적극적으로 만나주세요. 횡재·부수입·환급 신호도 살짝 와요. 단 큰 베팅은 충분히 검증한 뒤에 결정해주세요.',
    '움직이는 만큼 운이 열리는 달이에요. 낯선 자리·처음 보는 사람과의 만남에서 뜻밖의 기회가 들어와요. 오래된 인맥에도 안부 연락 한 번 해보세요. 단 큰 베팅이나 즉흥 투자는 충분히 검증 후에 해주세요.',
    '횡재 신호가 살짝 들어오는 달이에요. 평소보다 정보·기회·만남이 활발해지는 시기예요. 익숙한 자리에 안주하기보다 새로운 곳에 한 번 더 나가는 게 이번 달 답이에요. 잊고 있던 환급·포인트·캐시백도 한 번 확인해보세요.',
  ],
  정관: [
    '책임이 보상으로 돌아오는 달이에요. 약속·신뢰·정공법이 그대로 운으로 와요. 윗사람·고객·평가자에게 인정받기 좋은 시기예요. 단 무리·번아웃이 올 수 있으니 잠은 꼭 챙겨주세요.',
    '신뢰가 곧 운이 되는 달이에요. 작은 약속도 꼼꼼히 지키면 평소보다 더 크게 돌아와요. 면담·평가·발표가 있다면 정공법으로 준비하는 게 답이에요. 책임감으로 무리하기 쉬운 달이니 잠 챙기는 것 잊지 마세요.',
    '성실함이 빛나는 달이에요. 화려한 어필보다 묵묵히 기대에 부응하는 방식이 인정으로 이어져요. 윗사람이나 고객에게 "이 사람 믿을 수 있네" 신호를 심기 좋은 타이밍이에요. 단 잠 줄여가며 일하는 건 오히려 역효과가 나요.',
  ],
  편관: [
    '압박·과제 많지만 정면 돌파하면 한 단계 성장하는 달이에요. 도망치지 말고 한 가지씩 처리해주세요. 단 갈등·다툼·갑작스러운 지출도 함께 올 수 있으니 비상금·결제 한도를 확인해두세요.',
    '쌓인 숙제들을 하나씩 처리하기 좋은 달이에요. 버거워 보여도 한 가지씩 정면으로 마주치면 의외로 빨리 끝나요. 도망치면 압박이 두 배가 되고 직면하면 성장으로 바뀌는 시기예요. 비상금·결제 한도는 미리 점검해두세요.',
    '강한 흐름이 들어오는 달이에요. 외부 압박이나 갑작스러운 변수에 흔들리기 쉬운 시기예요. 큰 그림보다 오늘 처리할 한 가지에 집중하는 방식이 맞아요. 에너지 소모가 크니 충분한 수면과 회복 시간을 꼭 챙겨주세요.',
  ],
  정인: [
    '배우고 채우는 달이에요. 큰 도약보단 내공 쌓기에 집중하기 좋은 시기예요. 멘토·자료·강의를 만나는 신호가 와요. 책 한 권·강의 하나가 한 달 자산이 돼요.',
    '지식과 지원이 자연스럽게 모이는 달이에요. 평소 궁금했던 분야의 책이나 강의를 시작해보세요. 선배나 멘토에게 조언을 구하면 뜻밖에 도움이 돼요. 큰 결정보다 배움을 쌓는 것이 이번 달 최선이에요.',
    '배울수록 다음이 풀리는 달이에요. 공부·독서·세미나처럼 채우는 활동이 운을 끌어들이는 시기예요. 빠른 결과보다 내공 쌓기에 집중하면 다음 달에 그게 기회로 연결돼요. 조용히 집중하는 환경을 만들어두는 것만으로도 충분해요.',
  ],
  편인: [
    '직관·영감이 빛나는 달이에요. 평범하지 않은 길에서 본인만의 답을 찾는 시기예요. 단 큰 결정·투자·계약은 일단 미뤄주세요. 직감만 믿고 큰 결정 내리는 건 위험해요.',
    '번뜩이는 아이디어가 자주 떠오르는 달이에요. 분석보다 직관이 더 정확한 시기라 느낌을 따라가는 게 맞아요. 단 큰 돈이나 중요한 계약은 직감만으로 결정하지 마세요. 아이디어는 잘 적어두고 실행은 한 박자 뒤에 해주세요.',
    '남들이 안 보이는 게 보이는 달이에요. 창작·기획·리서치에서 본인만의 독특한 방향이 나오는 시기예요. 단 그 직관을 큰 투자나 계약에 바로 쓰는 건 위험해요. 지금은 아이디어를 모으고 결정은 잠시 미뤄두는 게 안전해요.',
  ],
};

/** 십성별 행동 가이드 3개 — 클릭 시 펼쳐지는 detail 포함 */
const MONTH_ACTIONS: Record<Sipsung, Array<{ ic: string; lbl: string; sub: string; detail: string }>> = {
  비견: [
    { ic: '🤝', lbl: '동료와 함께',     sub: '협업 자리에 운',
      detail: '이번 달 같이 일하는 동료에게 점심·커피를 먼저 제안해보세요. 비견이 강한 달은 같은 결의 사람들과 손 잡으면 두 배로 풀려요. 단 책임 분배는 처음부터 명확히 정해두세요 — 모호하면 나중에 갈등이 돼요.' },
    { ic: '👥', lbl: '모임 참여',       sub: '의외의 인연 상승',
      detail: '친구·동호회·동창회 같은 모임에 한 번이라도 참여해보세요. 친구의 친구를 통해 의외의 인연·정보·기회가 들어오는 흐름이에요. 새 사람 만날 자리에 한 번만 가도 한 달 운이 풀려요.' },
    { ic: '📋', lbl: '책임 분배 명확',   sub: '나중에 불씨 차단',
      detail: '팀 작업·공동 프로젝트에서 누가 뭘 맡을지 처음부터 명확히 적어두세요. 비견의 달은 협업 흐름이 강하지만 책임이 모호하면 나중에 갈등이 커져요. 문서·메모로 남겨두면 안전해요.' },
  ],
  겁재: [
    { ic: '⚠️', lbl: '큰 결정 보류',    sub: '24시간 룰',
      detail: '큰 지출·계약·투자는 결정 전 24시간 미루는 룰을 지켜주세요. 겁재의 달은 충동·과욕이 강해서 충동 결정이 며칠 뒤 후회로 돌아와요. 잠 한 번 자고 다시 봐도 좋으면 그때 결정해도 늦지 않아요.' },
    { ic: '🧘', lbl: '한 박자 쉬기',    sub: '발끈하지 않기',
      detail: '사소한 말투·SNS 글에 발끈해서 답할 것 같으면 한 번 호흡 깊게 들이마시고 멈춰주세요. 겁재가 강한 달은 평소보다 예민해져요. 화났을 때 보낸 메시지는 다음 날 후회로 와요.' },
    { ic: '💸', lbl: '충동 결제 주의',   sub: '이번 달은 절약',
      detail: 'SNS 광고·한정판·세일 알림에 흔들릴 수 있는 달이에요. 결제 직전에 24시간 미루는 룰만 지켜도 절반은 막아져요. 이번 달은 평소보다 한 끼 가볍게 가는 마인드가 답이에요.' },
  ],
  식신: [
    { ic: '✨', lbl: '새 시도 OK',      sub: '매력이 빛나는 달',
      detail: '평소 안 입던 색·머리 스타일·향수·취미를 한 번 시도해보세요. 식신의 달은 표현·매력이 자연스럽게 빛나는 시기라 새 시도가 다 운으로 와요. 작게 한 가지만 해도 충분해요.' },
    { ic: '📝', lbl: '기록 남기기',     sub: '들떠서 깜빡 주의',
      detail: '기분이 좋아서 약속·할 일을 깜빡할 수 있는 달이에요. 캘린더·메모·할 일 리스트를 한 번 더 챙겨두세요. 즐기는 건 좋지만 기록만 남겨두면 다음 달까지 그 운이 이어져요.' },
    { ic: '🎨', lbl: '창작 활동',       sub: '취미 수익화 검토',
      detail: '그림·글·요리·영상 같은 취미를 SNS·플랫폼에 올려보세요. 식신은 창작·표현이 운으로 돌아오는 시기라 작은 콘텐츠도 의외의 반응이 와요. 완벽하게 X — 일단 올리는 게 답이에요.' },
  ],
  상관: [
    { ic: '💡', lbl: '아이디어 메모',    sub: '한 줄이 시드',
      detail: '샤워하다·산책하다 떠오르는 아이디어를 한 줄이라도 메모해두세요. 상관의 달은 발상이 평소 두 배로 또렷해요. 메모 없이 흘려보내면 그 자리에서 끝, 적어두면 한 달 후 자산이 돼요.' },
    { ic: '🔥', lbl: '부업 검토',       sub: '사이드 프로젝트',
      detail: '본업 외 부업·사이드 프로젝트·콘텐츠 수익화를 검토해보세요. 상관의 달은 새 길을 만들기 좋은 시기예요. 단 즉흥적으로 큰 투자는 X — 메모만 해두고 다음 달 다시 보고 결정해주세요.' },
    { ic: '🎤', lbl: '톤 조절',        sub: '직설보다 부드럽게',
      detail: '옳은 말이라도 직설적으로 던지면 가시처럼 박힐 수 있는 달이에요. "이건 이상해" 대신 "이렇게 해보면 어때?"로 바꿔주세요. 같은 내용도 매력으로 들려요.' },
  ],
  정재: [
    { ic: '💰', lbl: '적금 점검',       sub: '이율 비교 타이밍',
      detail: '예금·적금 만기 일정과 이율을 한 번 비교해보세요. 정재의 달은 안정·정리가 답이라 새 투자보단 기존 자산 재배치가 큰 이익으로 와요. 5분만 투자해도 한 달치 추가 수익이 돼요.' },
    { ic: '📊', lbl: '계약 갱신',       sub: '꼼꼼히 읽고',
      detail: '월세·보험·구독 서비스 계약 갱신·해지 챙기기 좋은 달이에요. 약관 한 번 더 읽고 사인해주세요. 정재의 달은 작은 정리가 다음 달 큰 절약으로 돌아와요.' },
    { ic: '🧾', lbl: '서류 정리',       sub: '연말정산 미리',
      detail: '영수증·기부 영수증·의료비 서류를 미리 모아두세요. 연말 한 번에 몰리면 빠지는 게 생겨요. 정재 달은 차곡차곡 정리하는 자체가 그대로 환급으로 돌아와요.' },
  ],
  편재: [
    { ic: '🎯', lbl: '새 자리 가기',    sub: '낯선 곳에 운',
      detail: '평소 안 가던 카페·전시·모임 자리에 한 번 가보세요. 편재의 달은 익숙한 자리에만 있으면 운 절반을 놓쳐요. 의외의 정보·기회·만남이 낯선 곳에서 들어와요.' },
    { ic: '📞', lbl: '오랜 연락',       sub: '의외의 기회',
      detail: '한동안 연락 못 한 사람한테 안부 메시지 한 번 보내주세요. 편재가 강한 달은 오랜 인맥에서 의외의 기회·일이 들어와요. 짧은 인사 한 줄로도 충분해요.' },
    { ic: '💡', lbl: '횡재 안테나',     sub: '환급·캐시백 확인',
      detail: '잊고 있던 환급·캐시백·당첨 알림·포인트를 한 번 정리해보세요. 편재의 달은 작은 횡재 신호가 의외로 자주 와요. 단 큰 베팅은 X — 작은 돈만 받아주세요.' },
  ],
  정관: [
    { ic: '💼', lbl: '약속 지키기',     sub: '신뢰 상승',
      detail: '이번 달은 작은 약속도 한 번 더 지켜주세요. 정관의 달은 신뢰가 곧 운이라 작은 디테일까지 챙기면 윗사람·고객·평가자가 "이 사람 진짜네" 신호를 보내요.' },
    { ic: '🎓', lbl: '평가 준비',       sub: '윗사람 인정',
      detail: '면담·평가·발표가 있다면 정공법으로 준비해주세요. 정관 달은 화려한 트릭보다 묵묵한 신뢰가 빛나는 시기예요. 평소 안 보이던 디테일까지 챙기면 인정이 자연스럽게 따라와요.' },
    { ic: '😴', lbl: '잠 챙기기',       sub: '번아웃 주의',
      detail: '책임감으로 무리하기 쉬운 달이에요. 잠 줄이면서 일하는 건 절대 X. 잠이 곧 다음 날 신뢰의 자본이에요. 1시간에 한 번 5분 스트레칭, 7시간 수면 룰을 지켜주세요.' },
  ],
  편관: [
    { ic: '⚡', lbl: '정면 돌파',       sub: '한 가지씩 처리',
      detail: '쌓인 과제·미룬 일을 한 가지씩 정면 돌파해주세요. 편관의 달은 도망치면 압박이 더 커지는 시기예요. 끝나고 나면 "내가 저걸 했네?" 싶은 뿌듯함이 와요.' },
    { ic: '🏦', lbl: '비상금 확인',     sub: '갑작스러운 지출',
      detail: '통장 잔고와 신용카드 한도를 한 번 점검해주세요. 편관 달은 보험·수리·경조사 같은 갑작스러운 지출이 들어올 수 있어요. 미루지 말고 빠르게 처리하면 더 큰 문제는 안 돼요.' },
    { ic: '🌿', lbl: '회복 시간',       sub: '잠·산책 필수',
      detail: '에너지 소진이 큰 달이라 충분한 잠·산책·따뜻한 차로 회복 시간을 챙겨주세요. 카페인·자극적인 음식은 줄이고 부드러운 음식 위주로 가주세요. 강한 운동보단 산책·요가가 어울려요.' },
  ],
  정인: [
    { ic: '📚', lbl: '강의·책',         sub: '자기계발 투자',
      detail: '관심 있던 강의·책·세미나에 결제해도 좋은 달이에요. 정인의 달은 자기계발 투자가 운으로 돌아오는 시기라 배운 만큼 다음 분기 수익으로 와요. 단 무리한 결제는 X — 진짜 필요한 한두 개만 골라주세요.' },
    { ic: '☕', lbl: '멘토 만나기',      sub: '조언 한 마디',
      detail: '선배·멘토·전문가에게 차 한 잔 청해서 조언을 구해보세요. 정인의 달은 "이거 어떻게 하셨어요?" 질문 한 번이 한 시간 시행착오를 줄여줘요. 작은 만남이 큰 길을 열어요.' },
    { ic: '📝', lbl: '메모 정리',       sub: '내면 다지기',
      detail: '쌓인 메모·아이디어·생각을 한 번 정리해보세요. 정인의 달은 큰 도약보단 내공 쌓기에 집중하기 좋은 시기예요. 조용히 정리하는 시간이 다음 큰 도약의 연료가 돼요.' },
  ],
  편인: [
    { ic: '🌙', lbl: '직관 따라가기',    sub: '느낌 좋은 곳',
      detail: '"왠지 이쪽이 끌려" 같은 느낌을 한 번 따라가보세요. 편인의 달은 분석·논리보단 직관이 더 정확한 시기예요. 단 큰 돈·계약 결정은 X — 작은 선택만 직관으로 가주세요.' },
    { ic: '⏸️', lbl: '큰 결정 미루기',  sub: '일주일 뒤 다시',
      detail: '투자·계약·이직 같은 큰 결정은 일단 일주일 미뤄주세요. 편인 달은 직관은 강하지만 분석은 약해지기 쉬워 큰 돈을 베팅하면 위험해요. 일주일 뒤에도 좋아 보이면 그때 결정하는 게 안전해요.' },
    { ic: '🎨', lbl: '창작·기획',       sub: '아이디어 메모',
      detail: '글·그림·기획·연구 같은 창작 작업에 좋은 달이에요. 자유로운 시간을 확보해서 진짜 좋은 아이디어 하나만 메모해도 그게 한 달 자산이 돼요. 반복 업무는 한 번 더 검토해주세요.' },
  ],
};

export type MonthField = {
  ic: string; lbl: string; score: number; color: string; oneLine: string;
  /** 분야 풀이 (2~3줄) */
  body: string;
  /** 추천 행동 한 줄 (분야 베스트 날 강조) */
  action: string;
  /** 이 분야 가장 좋은 날 (1~말일) */
  best: number;
};

export type DayNote = { day: number; score: number; reason: string };

export type MonthForecast = {
  /** YYYY-MM */
  ym: string;
  /** 이번 달 점수 */
  monthScore: number;
  mood: string;
  tagline: string;
  /** 한 줄 요약 헤드라인 */
  headline: string;
  /** 한 달 흐름 풀이 (3~4줄) */
  monthBody: string;
  /** 4분야 점수 + 풀이 (총운·일·연애·돈) */
  fields: MonthField[];
  /** 이번 달 좋은 날 1개 (호환 유지) */
  bestDay: { day: number; score: number; hint: string };
  /** 이번 달 주의할 날 1개 (호환 유지) */
  worstDay: { day: number; score: number; hint: string };
  /** 좋은 날 TOP3 (오늘 이후) */
  luckyDays: DayNote[];
  /** 주의할 날 (오늘 이후) */
  cautionDays: DayNote[];
  /** 주차별 흐름 (1~4주) */
  weeks: Array<{ label: string; score: number; body: string }>;
  /** 일자별 점수 (1~말일) — 미니 그래프용 */
  daily: Array<{ day: number; score: number }>;
  /** 이번 달 행운 가이드 — 용신 기반 */
  luck: LuckGuide;
  /** 키워드 3개 */
  keywords: [string, string, string];
  /** 행동 가이드 3개 (펼치면 detail) */
  actions: Array<{ ic: string; lbl: string; sub: string; detail: string }>;
};

function fieldOneLine(field: 'overall' | 'work' | 'love' | 'money', score: number): string {
  const tier = score >= 85 ? 'high' : score >= 75 ? 'mid' : score >= 65 ? 'low' : 'warn';
  if (field === 'overall') {
    return tier === 'high' ? '활기 있는 흐름' : tier === 'mid' ? '안정적 흐름' : tier === 'low' ? '평이한 흐름' : '주의가 필요해요';
  }
  if (field === 'work') {
    return tier === 'high' ? '성과·인정 상승' : tier === 'mid' ? '꾸준히 쌓는 시기' : tier === 'low' ? '내실 다지기' : '번아웃 주의';
  }
  if (field === 'love') {
    return tier === 'high' ? '강한 인연 신호' : tier === 'mid' ? '안정적 케미' : tier === 'low' ? '담담한 흐름' : '오해 주의';
  }
  return tier === 'high' ? '수입 흐름 상승' : tier === 'mid' ? '안정' : tier === 'low' ? '평이' : '큰 지출 주의';
}

/** 좋은 날 한 줄 이유 (십성별) */
const DAY_GOOD_REASON: Record<Sipsung, string> = {
  비견: '사람과 함께 움직이기 좋은 날', 겁재: '경쟁·승부에 강한 날',
  식신: '하고 싶은 걸 시작하기 좋은 날', 상관: '아이디어가 빛나는 날',
  정재: '꾸준한 일이 결실로 오는 날', 편재: '뜻밖의 기회·만남이 오는 날',
  정관: '인정·신뢰를 얻기 좋은 날', 편관: '도전·돌파에 힘이 실리는 날',
  정인: '배움·귀인의 도움이 있는 날', 편인: '직감이 잘 맞는 날',
};
/** 주의할 날 한 줄 이유 (십성별) */
const DAY_CAUTION_REASON: Record<Sipsung, string> = {
  비견: '고집·의견 충돌 주의', 겁재: '충동·과욕 한 박자 쉬기',
  식신: '과식·과로 페이스 조절', 상관: '말실수·톤 조절 주의',
  정재: '지출·계약 꼼꼼히', 편재: '큰 베팅·충동구매 주의',
  정관: '압박·번아웃, 휴식 챙기기', 편관: '무리한 일정 줄이기',
  정인: '결정을 미루다 기회 놓치기 쉬움', 편인: '직감만으로 큰 결정 위험',
};
/** 이번 달 행운 가이드에 덧붙일 십성별 조언 한 줄 */
const MONTH_ADVICE: Record<Sipsung, string> = {
  비견: '혼자 끌어안지 말고 사람의 손을 빌려보세요.',
  겁재: '결정 전 한 박자 쉬고, 내 페이스를 지키세요.',
  식신: '떠오르는 건 일단 가볍게 시도하고 기록을 남기세요.',
  상관: '새 아이디어는 메모해두고 말의 온도는 한 번 더 살피세요.',
  정재: '새로 벌이기보다 진행 중인 일을 매듭짓는 데 집중하세요.',
  편재: '낯선 자리·새 사람을 만나되 큰 베팅은 검증 후에.',
  정관: '약속과 정공법이 곧 운이에요. 잠은 꼭 챙기세요.',
  편관: '피하지 말고 한 가지씩 정면 돌파, 회복 시간도 비워두세요.',
  정인: '책 한 권·강의 하나가 이번 달 자산이 돼요.',
  편인: '직관을 살리되 큰 결정은 한 박자 미루세요.',
};

type FieldKey = 'overall' | 'work' | 'love' | 'money';

/** 분야 풀이 (점수 티어별) */
function fieldBody(field: FieldKey, score: number): string {
  const t = score >= 85 ? 'high' : score >= 75 ? 'mid' : score >= 65 ? 'low' : 'warn';
  const M: Record<FieldKey, Record<string, string>> = {
    overall: {
      high: '이번 달 전체 기운이 활기차게 흐르는 시기예요. 미뤄둔 일을 시작하거나 새 도전을 걸기 좋아요.',
      mid: '큰 흔들림 없이 안정적으로 흐르는 달이에요. 무리하지 않고 페이스대로 가면 결과가 따라와요.',
      low: '평이한 흐름이라 새로 벌이기보단 진행 중인 일을 다지기 좋은 달이에요.',
      warn: '에너지가 살짝 처질 수 있는 달이에요. 욕심내기보다 컨디션 관리에 무게를 둬주세요.',
    },
    work: {
      high: '성과와 인정이 따라오는 시기예요. 중요한 제안·발표·평가를 적극적으로 잡아보세요.',
      mid: '꾸준히 쌓는 흐름이에요. 눈에 띄는 도약보단 신뢰를 다지는 한 달로 가면 좋아요.',
      low: '내실을 다지기 좋은 시기예요. 새 일을 벌이기보단 기존 업무의 완성도를 높여주세요.',
      warn: '업무 압박·번아웃이 올 수 있어요. 일정을 줄이고 우선순위를 분명히 해주세요.',
    },
    love: {
      high: '인연 신호가 강한 달이에요. 새 만남·고백·관계 진전에 좋은 기운이 흘러요.',
      mid: '안정적인 케미가 흐르는 달이에요. 무던하게 챙기는 표현 하나가 관계를 단단히 해줘요.',
      low: '담담한 흐름이에요. 큰 이벤트보단 일상의 작은 다정함에 집중하기 좋아요.',
      warn: '오해·다툼이 생기기 쉬운 달이에요. 평소보다 한 번 더 마음을 말로 표현해주세요.',
    },
    money: {
      high: '수입·자산 흐름이 좋은 달이에요. 저축·투자 점검과 큰 결정을 몰아서 처리하기 좋아요.',
      mid: '재물 흐름이 안정적이에요. 무리한 베팅보단 고정비 정리·저축 점검이 답이에요.',
      low: '평이한 재물 흐름이에요. 새 지출을 늘리기보단 지키는 데 무게를 둬주세요.',
      warn: '큰 지출·갑작스러운 비용이 생길 수 있어요. 결제·계약은 한 번 더 확인해주세요.',
    },
  };
  return M[field][t];
}

/** 분야 추천 행동 (베스트 날 강조) */
function fieldAction(field: FieldKey, bestDay: number): string {
  if (field === 'overall') return `${bestDay}일 전후로 중요한 일을 배치하면 흐름을 타기 좋아요.`;
  if (field === 'work') return `${bestDay}일 전후에 미팅·제안·발표를 잡아보세요.`;
  if (field === 'love') return `${bestDay}일 전후 약속·데이트에 좋은 기운이에요.`;
  return `${bestDay}일 전후로 결제·투자 점검을 몰아서 하면 좋아요.`;
}

type DailyEntry = { day: number; score: number; sip: Sipsung | null };

/** 분야별 가장 좋은 날 — 해당 분야 점수(SCORE[sip][field])가 가장 높은 날 */
function fieldBestDay(pool: DailyEntry[], field: FieldKey): number {
  let best = pool[0];
  let bestV = -1;
  for (const d of pool) {
    const v = d.sip ? SCORE[d.sip][field] : 70;
    if (v > bestV) { bestV = v; best = d; }
  }
  return best.day;
}

/** 주차별 흐름 (1~7 / 8~14 / 15~21 / 22~말일) */
function buildWeeks(daily: DailyEntry[]): Array<{ label: string; score: number; body: string }> {
  const ranges: Array<[string, number, number]> = [
    ['1주차 (1~7일)', 1, 7], ['2주차 (8~14일)', 8, 14], ['3주차 (15~21일)', 15, 21], ['4주차 (22일~)', 22, 99],
  ];
  const weeks = ranges.map(([label, from, to]) => {
    const arr = daily.filter((d) => d.day >= from && d.day <= to);
    const score = arr.length ? Math.round(arr.reduce((s, d) => s + d.score, 0) / arr.length) : 70;
    return { label, score, arr };
  });
  const best = weeks.reduce((a, b) => (b.score > a.score ? b : a));
  return weeks.map((w) => ({
    label: w.label,
    score: w.score,
    body: w.label === best.label
      ? '이번 달 흐름이 가장 좋은 주예요. 중요한 일·약속을 이 주에 몰아주면 결과가 좋아요.'
      : w.score >= 78 ? '활기 있는 한 주예요. 적극적으로 움직여도 좋아요.'
      : w.score >= 70 ? '안정적인 한 주예요. 페이스대로 가면 충분해요.'
      : '컨디션·지출을 챙기며 무리하지 않는 게 좋은 주예요.',
  }));
}

export function monthForecast(myeongsik: Myeongsik, today: Date = new Date()): MonthForecast | null {
  const myIlgan = myeongsik.ilgan.c;
  if (!isStem(myIlgan)) return null;
  const seed = myeongsikSeed(myeongsik);

  const y = today.getFullYear();
  const mo = today.getMonth() + 1;
  const ym = `${y}-${String(mo).padStart(2, '0')}`;

  // 이번 달 월주 천간 → 십성
  const r = calculateSaju(y, mo, 15, 12, 0, { applyTimeCorrection: false });
  const monthStem = r.monthPillarHanja[0];
  const sipsung: Sipsung = isStem(monthStem) ? getSipsung(myIlgan, monthStem) : '식신';
  const base = SCORE[sipsung];
  const adjust = (key: string, v: number) =>
    Math.max(50, Math.min(98, v + variance(seed, `${ym}_${key}`, 3)));

  const overall = adjust('overall', base.overall);
  const work    = adjust('work',    base.work);
  const love    = adjust('love',    base.love);
  const money   = adjust('money',   base.money);

  // 이번 달 일자별 일진 천간 → 점수 + 십성
  const daysInMonth = new Date(y, mo, 0).getDate();
  const daily: DailyEntry[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dr = calculateSaju(y, mo, d, 12, 0, { applyTimeCorrection: false });
    const ds = dr.dayPillarHanja[0];
    const sip = isStem(ds) ? getSipsung(myIlgan, ds) : null;
    const sc = sip ? SCORE[sip].overall : 70;
    const adj = Math.max(50, Math.min(98, sc + variance(seed, `${ym}_d${d}`, 3)));
    daily.push({ day: d, score: adj, sip });
  }

  // 오늘 이후 (오늘 포함) 중 best/worst — 미래만 의미 있음
  const todayDay = today.getDate();
  const future = daily.filter((x) => x.day >= todayDay);
  const pool = future.length > 0 ? future : daily;
  const best = pool.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = pool.reduce((a, b) => (b.score < a.score ? b : a));

  // 좋은 날 TOP3 / 주의할 날 — 오늘 이후 풀에서
  const luckyDays: DayNote[] = [...pool].sort((a, b) => b.score - a.score).slice(0, 3).map((d) => ({
    day: d.day, score: d.score, reason: d.sip ? DAY_GOOD_REASON[d.sip] : '흐름이 좋은 날',
  }));
  const cautionDays: DayNote[] = [...pool].sort((a, b) => a.score - b.score).slice(0, 2).map((d) => ({
    day: d.day, score: d.score, reason: d.sip ? DAY_CAUTION_REASON[d.sip] : '평소보다 한 박자 천천히',
  }));

  const toneWord = overall >= 80 ? '상승세' : overall >= 72 ? '안정세' : '정비기';
  const fieldDefs: Array<{ ic: string; lbl: string; key: FieldKey; score: number; color: string }> = [
    { ic: '☁️', lbl: '총운',     key: 'overall', score: overall, color: '#9D7BFF' },
    { ic: '💼', lbl: '일·커리어', key: 'work',    score: work,    color: '#5B8DEF' },
    { ic: '💞', lbl: '연애',      key: 'love',    score: love,    color: '#F495C9' },
    { ic: '💰', lbl: '재물',      key: 'money',   score: money,   color: '#3DC795' },
  ];

  return {
    ym,
    monthScore: overall,
    mood: MOOD[sipsung],
    tagline: TAGLINE[sipsung],
    headline: `${best.day}일에 흐름이 가장 좋은 ${toneWord}의 달 — 이번 달 평균 ${overall}점이에요.`,
    monthBody: `${pickBySeed(seed, `${ym}_body`, MONTH_BODY[sipsung])} ${profileHint(myeongsik, 'month')}`,
    fields: fieldDefs.map((f) => {
      const bestD = fieldBestDay(pool, f.key);
      return {
        ic: f.ic, lbl: f.lbl, score: f.score, color: f.color,
        oneLine: fieldOneLine(f.key, f.score),
        body: fieldBody(f.key, f.score),
        action: fieldAction(f.key, bestD),
        best: bestD,
      };
    }),
    bestDay: {
      day: best.day,
      score: best.score,
      hint: best.score >= 85 ? '큰 일 시도해도 OK' : '컨디션이 좋은 날',
    },
    worstDay: {
      day: worst.day,
      score: worst.score,
      hint: worst.score < 65 ? '중요 결정 피해주세요' : '평소처럼 차분히',
    },
    luckyDays,
    cautionDays,
    weeks: buildWeeks(daily),
    daily: daily.map((d) => ({ day: d.day, score: d.score })),
    luck: buildPeriodLuckGuide(STEM_OHAENG[monthStem] ?? myeongsik.shinkang.yongshin.ohaeng, myeongsik, { lead: '이번 달은', advice: [MONTH_ADVICE[sipsung]] }),
    keywords: KEYWORDS[sipsung],
    actions: rotateBySeed(seed, `${ym}_d${today.getDate()}_actions`, MONTH_ACTIONS[sipsung], 3),
  };
}
