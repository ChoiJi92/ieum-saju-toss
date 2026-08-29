#!/usr/bin/env node
/**
 * 유료 리포트 문장 규칙 검사기.
 *
 * 프롬프트에 쌓인 규칙은 지시일 뿐 강제가 아니라서, 모델이 확률적으로 어긴다.
 * 실제로 "하필"을 좋은 일에 붙이는 위반은 세 번에 한 번꼴로 나왔다.
 * 눈으로 보는 대신 여기서 기계로 훑는다.
 *
 *   node scripts/check-report-rules.mjs /tmp/ch1.txt /tmp/ch2.txt
 *   node scripts/check-report-rules.mjs --order <orderId>     서버에서 꺼내 검사
 *   node scripts/check-report-rules.mjs --order <id> --name 김예지
 *
 * 서버 조회는 .env.supabase 의 SUPABASE_FUNCTIONS_URL / SUPABASE_ANON_KEY 를 쓴다.
 * 위반이 있으면 종료 코드 1.
 */
import { readFileSync, existsSync } from 'node:fs';

/* ─── 규칙 ────────────────────────────────────────────────── */

/** 명식 구조 용어. 읽는 사람은 명식이 위아래 두 줄이라는 것조차 모른다. */
const STRUCTURE_TERMS = [
  '천간', '지지', '일간', '일지', '월지', '연지', '시지',
  '일주', '월주', '연주', '시주',
];

/**
 * "하필"은 바로 뒤에 오는 말에 걸린다. 같은 문장에 좋은 말이 있는지가 아니라
 * "하필" 다음이 나쁜 소식인지를 봐야 한다.
 *
 *   맞음: 길성인데, 하필 그게 가장 약한 불의 자리에 붙어 있어요.  ← 뒤가 "약한"
 *   틀림: 다행히 천을귀인이 있는데, 하필 그 자리가 정인과 겹쳐요.  ← 뒤가 "겹친다"(좋은 일)
 */
const NEGATIVE_AFTER_HAPIL = ['약한', '약하', '없', '부족', '하나뿐', '적은', '적다', '눌리', '눌러',
  '막히', '막는', '흔들', '끊기', '꺼지', '비어', '모자'];
const POSITIVE_AFTER_HAPIL = ['귀인', '길성', '도움', '필요한', '좋', '복', '유리', '기회', '선물', '겹'];
/** "하필" 뒤 몇 글자를 볼지. 한 절이면 충분하다. */
const HAPIL_WINDOW = 40;

/** 앞 문장이 아무 정보도 주지 않고 답을 미루는 표현. */
const STALLING = ['이거예요', '이겁니다', '이것입니다', '다음과 같아요', '다음과 같습니다', '눈에 들어오는 건', '눈에 띄는 건'];

/** 풀어 쓰지 않으면 안 되는 전문 용어. 오행 생극 조합도 여기 해당한다. */
const JARGON = [
  '살인상생', '관살혼잡', '식신생재', '재생관', '군겁쟁재', '식상생재',
  '목생화', '화생토', '토생금', '금생수', '수생목',
  '목극토', '토극수', '수극화', '화극금', '금극목',
];

/**
 * 오행은 우리말로만 쓴다. 화면 막대가 "나무·불·흙·쇠·물"이라, 글이 한자어를 쓰면
 * 읽는 사람이 같은 것을 가리키는 줄 모른다.
 *
 * "을목(乙木)"처럼 낱글자 이름을 병기하는 건 허용이므로, 괄호 안이나 바로 뒤에
 * 한자가 붙은 경우는 뺀다. 조사가 붙은 형태만 낱말로 본다.
 */
const OHAENG_HANJA = [
  { word: '목', ko: '나무' }, { word: '화', ko: '불' }, { word: '토', ko: '흙' },
  { word: '금', ko: '쇠' }, { word: '수', ko: '물' },
];
/** 오행 한자어 뒤에 이런 조사가 붙으면 오행을 가리키는 낱말로 본다. */
const OHAENG_JOSA = ['이', '가', '은', '는', '을', '를', '도', '만', '과', '와', '의', '으로', '로'];

/**
 * 사주 얘기를 하는 문장인지.
 *
 * 이게 없으면 "볼 수가 없다", "화가 난다" 같은 평범한 말을 오행으로 오인한다.
 * 한자 병기, 오행 우리말, 십성 이름, 개수를 세는 말이 곁에 있으면 사주 문맥으로 본다.
 */
const SAJU_CONTEXT = new RegExp([
  '[\\u4e00-\\u9fff]',                                  // 한자 병기 — 을목(乙木)
  '기운|글자|사주|오행|대운|세운|용신|신살',
  '나무|불|흙|쇠|물',
  '정관|편관|정인|편인|식신|상관|정재|편재|비견|겁재',
  '하나뿐|둘|셋|넷|다섯|하나도',
].join('|'));

const HANJA = /[一-鿿]/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

/* ─── 검사 ────────────────────────────────────────────────── */

/**
 * 한 문장씩. 마침표 기준이라 완벽하진 않지만 위반 위치를 짚기엔 충분하다.
 *
 * 소제목도 본다. 전에는 ## 로 시작하는 줄을 통째로 걸렀는데, 실제 리포트에서
 * 본문은 전부 "쇠"로 쓰면서 소제목만 "다시 들어온 금", "겹겹이 오는 금의 창"처럼
 * 한자어가 남았다. 읽는 사람에게는 소제목이 더 크게 보인다.
 */
function sentences(text) {
  const out = [];
  for (const raw of text.split('\n')) {
    const heading = /^#{1,3}\s/.test(raw);
    const line = raw.replace(/^#{1,3}\s*/, '').replace(/^>\s*/, '');
    for (const part of line.split(/(?<=[.!?])\s+/)) {
      const t = part.trim();
      if (t) out.push({ text: t, heading });
    }
  }
  return out;
}

/**
 * 한자가 한글 병기 없이 홀로 쓰였는지.
 * 허용: 무토(戊土), 을목(乙木) — 여는 괄호 바로 앞이 한글인 형태.
 */
function bareHanja(sentence) {
  const found = [];
  const re = /[一-鿿]+/g;
  let m;
  while ((m = re.exec(sentence)) !== null) {
    const before = sentence.slice(Math.max(0, m.index - 1), m.index);
    const after = sentence.slice(m.index + m[0].length, m.index + m[0].length + 1);
    // 한글(한자) 꼴이면 통과
    if (before === '(' && after === ')') {
      const kor = sentence.slice(0, m.index - 1);
      if (/[가-힣]$/.test(kor)) continue;
    }
    found.push(m[0]);
  }
  return found;
}

/**
 * 구조 용어가 낱말로 쓰였는지.
 *
 * 그냥 includes 로 찾으면 "꺼지지는"에서 "지지"를, "일주일"에서 "일주"를 잡는다.
 * 한국어는 낱말 경계가 없으니, 앞 글자가 한글이면 다른 말의 일부로 본다.
 */
function usesTerm(s, term) {
  let i = 0;
  while ((i = s.indexOf(term, i)) !== -1) {
    const precededByHangul = i > 0 && /[가-힣]/.test(s[i - 1]);
    const after = s.slice(i + term.length, i + term.length + 1);
    const compound = term === '일주' && after === '일';   // 일주일
    if (!precededByHangul && !compound) return true;
    i += term.length;
  }
  return false;
}

/**
 * 오행을 한자어로 쓴 낱말 찾기.
 *
 * "볼 수가", "화가 났다", "목이 아프다"처럼 흔한 말과 겹치므로 조심해야 한다.
 * 앞 글자가 한글이 아니고 뒤에 조사가 붙은 것만 후보로 본다. 그래도 확신이 안 되니
 * 한 문장에 둘 이상 몰릴 때만 위반으로 올리고, 하나뿐이면 경고로 남긴다.
 * "을목(乙木)"처럼 한자를 병기한 낱글자 이름은 규칙이 허용하므로 뺀다.
 */
function ohaengHanja(sentence, heading = false) {
  // 사주 얘기를 하는 문장에서만 본다. "볼 수가 없다", "화가 난다"를 잡지 않기 위해서다.
  // 소제목은 예외다. 짧아서 문맥 단서가 안 걸리는데("그다음 겹겹이 오는 금의 창"),
  // 리포트 소제목이 사주 얘기가 아닐 리는 없다.
  if (!heading && !SAJU_CONTEXT.test(sentence)) return [];
  const found = new Set();
  for (const { word, ko } of OHAENG_HANJA) {
    let i = 0;
    while ((i = sentence.indexOf(word, i)) !== -1) {
      const start = i;
      i += word.length;
      if (start > 0 && /[가-힣]/.test(sentence[start - 1])) continue;   // 다른 말의 일부
      const rest = sentence.slice(i);
      if (/^[(（一-鿿]/.test(rest)) continue;                            // 을목(乙木)
      // 소제목은 "다시 들어온 금"처럼 조사 없이 끝나기도 한다.
      const ends = rest === '' || /^[\s,·]/.test(rest);
      if (!OHAENG_JOSA.some((j) => rest.startsWith(j)) && !(heading && ends)) continue;
      found.add(`${word}→${ko}`);
    }
  }
  return [...found];
}

function checkText(text, label, opts = {}) {
  const issues = [];
  const add = (level, rule, detail) => issues.push({ level, rule, detail, label });

  const body = text.trim();
  // 한국어 분량은 공백을 넣어 센다. 프롬프트의 "2,000자 내외"도 그 기준이다.
  // 다만 마크다운 기호(##, ###, >, **)는 본문이 아니라 빼둔다.
  const chars = body.replace(/^#{1,3}\s*/gm, '').replace(/^>\s*/gm, '').replace(/\*\*/g, '').length;

  // 분량 — 프롬프트가 요구하는 2,000자 내외
  if (chars < 1700) add('warn', '분량', `${chars}자 — 1,800자에 못 미칩니다`);
  if (chars > 2600) add('warn', '분량', `${chars}자 — 2,200자를 크게 넘습니다`);

  // 인용줄 — 장마다 딱 하나
  const quotes = body.split('\n').filter((l) => l.trim().startsWith('> '));
  if (quotes.length === 0) add('error', '인용줄', '`> ` 로 시작하는 핵심 문장이 없습니다');
  if (quotes.length > 1) add('error', '인용줄', `${quotes.length}개 — 장마다 하나여야 합니다`);
  for (const q of quotes) {
    if (q.replace(/\s/g, '').length > 90) add('warn', '인용줄', `너무 깁니다: ${q.slice(0, 50)}…`);
  }

  // 장 제목은 프롬프트가 지정한 고정 문구라 검사 대상이 아니다.
  const FIXED_TITLES = ['조각이 맞물리는 자리', '그 구조가 시기와 만나면'];
  for (const { text: s, heading } of sentences(body)) {
    if (FIXED_TITLES.some((t) => s.includes(t))) continue;
    const bare = bareHanja(s);
    if (bare.length) add('error', '한자 단독', `${bare.join(', ')} — 「한글(한자)」로 병기해야 합니다\n    ${s}`);

    for (const t of STRUCTURE_TERMS) {
      if (usesTerm(s, t)) add('error', '구조 용어', `"${t}" — "위 글자/아래 글자"로 풀어야 합니다\n    ${s}`);
    }

    const hapil = s.indexOf('하필');
    if (hapil >= 0) {
      const after = s.slice(hapil + 2, hapil + 2 + HAPIL_WINDOW);
      const bad = NEGATIVE_AFTER_HAPIL.some((w) => after.includes(w));
      const good = POSITIVE_AFTER_HAPIL.some((w) => after.includes(w));
      if (!bad && good) add('error', '하필', `뒤에 좋은 소식이 옵니다\n    ${s}`);
      else if (!bad && !good) add('warn', '하필', `뒤가 나쁜 소식인지 확인\n    ${s}`);
    }

    for (const t of STALLING) {
      if (s.includes(t)) add('error', '뜸들이기', `"${t}" — 사실을 바로 쓰세요\n    ${s}`);
    }

    for (const t of JARGON) {
      if (s.includes(t)) add('error', '전문 용어', `"${t}" — 풀어 쓰거나 빼세요\n    ${s}`);
    }

    if (EMOJI.test(s)) add('error', '이모지', s);

    // 소제목은 오탐 여지가 적고 눈에 크게 띄므로 하나만 나와도 위반으로 본다.
    const oh = ohaengHanja(s, heading);
    if (oh.length >= 2 || (heading && oh.length === 1)) {
      add('error', '오행 한자어', `${oh.join(', ')} — 우리말로 써야 화면 막대와 같은 말이 됩니다\n    ${s}`);
    } else if (oh.length === 1) {
      add('warn', '오행 한자어', `${oh[0]} — 일반 낱말과 겹칠 수 있으니 확인\n    ${s}`);
    }
  }

  // 이름 표기 흔들림
  if (opts.name) {
    const full = `${opts.name}님`;
    if (!body.includes(full)) add('error', '이름', `"${full}" 표기가 한 번도 없습니다`);
    // 성을 뗀 형태가 섞였는지 (김예지 → 예지님).
    // "최지훈님" 안에도 "지훈님"이 들어 있으므로, 앞 글자가 성이면 제대로 부른 것이다.
    if (opts.name.length === 3) {
      const short = `${opts.name.slice(1)}님`;
      let i = 0;
      while ((i = body.indexOf(short, i)) !== -1) {
        if (i === 0 || body[i - 1] !== opts.name[0]) {
          add('error', '이름', `"${short}"으로 줄여 부른 곳이 있습니다`);
          break;
        }
        i += short.length;
      }
    }
  }

  return { issues, chars };
}

/* ─── 입력 ────────────────────────────────────────────────── */

async function fromServer(orderId) {
  if (!existsSync('.env.supabase')) {
    throw new Error('.env.supabase 가 필요합니다 (SUPABASE_FUNCTIONS_URL / SUPABASE_ANON_KEY)');
  }
  const env = Object.fromEntries(
    readFileSync('.env.supabase', 'utf8').split('\n')
      .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
      .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
  );
  const url = env.SUPABASE_FUNCTIONS_URL;
  const key = env.SUPABASE_ANON_KEY;
  const res = await fetch(`${url}/fetch?orderId=${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const r = await res.json();
  return [
    r.content_1 ? { label: '1장', text: r.content_1 } : null,
    r.content_2 ? { label: '2장', text: r.content_2 } : null,
  ].filter(Boolean).map((c) => ({ ...c, name: r.profile_name }));
}

/* ─── 실행 ────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const nameIdx = argv.indexOf('--name');
const forcedName = nameIdx >= 0 ? argv[nameIdx + 1] : null;
const orderIdx = argv.indexOf('--order');

let chapters;
if (orderIdx >= 0) {
  chapters = await fromServer(argv[orderIdx + 1]);
} else {
  const files = argv.filter((a) => !a.startsWith('--') && a !== forcedName);
  if (!files.length) {
    console.error('사용법: node scripts/check-report-rules.mjs <파일…> | --order <orderId> [--name 이름]');
    process.exit(2);
  }
  chapters = files.map((f, i) => ({ label: `${i + 1}장 (${f})`, text: readFileSync(f, 'utf8') }));
}

let errors = 0, warns = 0;
for (const ch of chapters) {
  const { issues, chars } = checkText(ch.text, ch.label, { name: forcedName ?? ch.name });
  console.log(`\n━━ ${ch.label} · ${chars}자 ━━`);
  if (!issues.length) { console.log('  위반 없음'); continue; }
  for (const it of issues) {
    const mark = it.level === 'error' ? '✗' : '△';
    if (it.level === 'error') errors++; else warns++;
    console.log(`  ${mark} [${it.rule}] ${it.detail}`);
  }
}

console.log(`\n─────────────────────────`);
console.log(`위반 ${errors}건 · 경고 ${warns}건`);
process.exit(errors > 0 ? 1 : 0);
