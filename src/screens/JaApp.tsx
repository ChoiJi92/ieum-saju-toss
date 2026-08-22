import { useMemo, useState, useEffect } from 'react';
import { computeMyeongsik, type SajuInput } from '../lib/saju';
import { spiritFromMyeongsik, type Spirit } from '../lib/spirit';
import { UI_JA, RARITY_JA, ZODIAC_JA, spiritNameJa, spiritImgJa, titleJa, personaJa } from '../lib/i18n-ja';
import { Analytics } from '@vercel/analytics/react';
import { track } from '@vercel/analytics';
import { prepareJaCard, shareJaCard, type PreparedJaCard } from '../lib/ja-card';

/**
 * 일본어 웹판 — 생년월일 → 정령 → 카드 공유. 단일 페이지.
 *
 * 스코프(의도적으로 축소): 교감·도감·운세·광고·로그인 없음. 후킹 검증 전용.
 * 레이아웃: 모바일 우선. 데스크톱은 max-width 컬럼을 가운데 두고 배경만 확장.
 */

const YEARS = Array.from({ length: 2015 - 1940 + 1 }, (_, i) => 2015 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const field: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '13px 12px',
  borderRadius: 14,
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.14)',
  color: 'var(--v2-ink)',
  fontSize: 15,
  fontWeight: 700,
  fontFamily: 'inherit',
  appearance: 'none',
  WebkitAppearance: 'none',
  textAlign: 'center',
};

function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2.4 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.8 ? '#FFD27A' : Math.random() > 0.5 ? '#B79CFF' : '#FFFFFF',
      })),
    []
  );
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.color,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default function JaApp() {
  // 전역 CSS(index.css)는 토스 미니앱용이라 body 스크롤이 잠겨 있다. 웹판에서만 해제.
  useEffect(() => {
    // index.css: body{overflow:hidden;height:100dvh}, #root{position:fixed;inset:0}
    // → 웹에서는 문서가 뷰포트에 갇혀 스크롤이 죽는다. 세 곳을 모두 풀어준다.
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const saved = {
      html: html.getAttribute('style'),
      body: body.getAttribute('style'),
      root: root?.getAttribute('style') ?? null,
    };
    Object.assign(html.style, { height: 'auto', width: '100%', overflow: 'visible' });
    Object.assign(body.style, { height: 'auto', width: '100%', overflow: 'visible', overscrollBehavior: 'auto' });
    if (root) {
      Object.assign(root.style, { position: 'static', inset: 'auto', height: 'auto', width: '100%', display: 'block' });
    }
    return () => {
      const restore = (el: HTMLElement | null, v: string | null) => {
        if (!el) return;
        if (v === null) el.removeAttribute('style');
        else el.setAttribute('style', v);
      };
      restore(html, saved.html);
      restore(body, saved.body);
      restore(root, saved.root);
    };
  }, []);

  const [year, setYear] = useState(1995);
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(13);
  const [lunar, setLunar] = useState(false);
  const [unknownTime, setUnknownTime] = useState(true);
  const [hour, setHour] = useState(12);
  const [result, setResult] = useState<Spirit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<PreparedJaCard | null>(null);

  // 결과가 나오면 공유 카드를 미리 생성 (클릭 시 사용자 제스처 보존)
  useEffect(() => {
    if (!result) { setCard(null); return; }
    let alive = true;
    void prepareJaCard(result).then((c) => { if (alive) setCard(c); });
    return () => { alive = false; };
  }, [result]);

  const submit = () => {
    setError(null);
    const input: SajuInput = {
      year, month, day,
      calendar: lunar ? 'lunar' : 'solar',
      hour: unknownTime ? undefined : hour,
      minute: 0,
      gender: 'female',
      name: 'you',
    };
    try {
      const s = spiritFromMyeongsik(computeMyeongsik(input));
      setResult(s);
      track('spirit_revealed', { spirit: s.key, rarity: s.rarity.key, lunar });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('この日付は計算できませんでした。日付をご確認ください。');
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(180deg,#2A2046 0%,#1E1635 55%,#14101F 100%)',
        display: 'flex',
        justifyContent: 'center',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif',
        color: 'var(--v2-ink)',
      }}
    >
      {/* 모바일 우선 컬럼 — 데스크톱에선 가운데 정렬 */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, padding: '0 20px 60px' }}>
        <Analytics />
        <Stars />
        <div style={{ position: 'relative' }}>
          {!result ? (
            <>
              <div style={{ paddingTop: 56, textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-butter)', letterSpacing: 1.5 }}>
                  韓国の四柱推命
                </div>
                <h1 style={{ fontSize: 27, fontWeight: 800, marginTop: 12, lineHeight: 1.45 }}>
                  あなただけの
                  <br />
                  精霊を呼び出す
                </h1>
                <p style={{ fontSize: 14, color: 'var(--v2-ink-dim)', marginTop: 12, lineHeight: 1.6 }}>
                  {UI_JA.inputSub}
                </p>
              </div>

              <div
                style={{
                  marginTop: 30,
                  padding: 20,
                  borderRadius: 20,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.12)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>{UI_JA.inputTitle}</div>

                {/* 신력/구력 */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[
                    { v: false, label: UI_JA.calendarSolar },
                    { v: true, label: UI_JA.calendarLunar },
                  ].map((o) => (
                    <button
                      key={o.label}
                      onClick={() => setLunar(o.v)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        background: lunar === o.v ? 'rgba(183,156,255,.22)' : 'rgba(255,255,255,.05)',
                        border: `1px solid ${lunar === o.v ? 'rgba(183,156,255,.6)' : 'rgba(255,255,255,.12)'}`,
                        color: lunar === o.v ? 'var(--v2-ink)' : 'var(--v2-ink-dim)',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {/* 생년월일 */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select style={field} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    {YEARS.map((y) => (
                      <option key={y} value={y} style={{ color: '#000' }}>{y}{UI_JA.year}</option>
                    ))}
                  </select>
                  <select style={field} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {MONTHS.map((m) => (
                      <option key={m} value={m} style={{ color: '#000' }}>{m}{UI_JA.month}</option>
                    ))}
                  </select>
                  <select style={field} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                    {DAYS.map((d) => (
                      <option key={d} value={d} style={{ color: '#000' }}>{d}{UI_JA.day}</option>
                    ))}
                  </select>
                </div>

                {/* 시간 */}
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                  {UI_JA.hourLabel}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => setUnknownTime(!unknownTime)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      fontSize: 13.5,
                      fontWeight: 800,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      background: unknownTime ? 'rgba(183,156,255,.22)' : 'rgba(255,255,255,.05)',
                      border: `1px solid ${unknownTime ? 'rgba(183,156,255,.6)' : 'rgba(255,255,255,.12)'}`,
                      color: unknownTime ? 'var(--v2-ink)' : 'var(--v2-ink-dim)',
                    }}
                  >
                    {UI_JA.hourUnknown}
                  </button>
                  <select
                    style={{ ...field, opacity: unknownTime ? 0.4 : 1 }}
                    value={hour}
                    disabled={unknownTime}
                    onChange={(e) => setHour(Number(e.target.value))}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h} style={{ color: '#000' }}>{h}時</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={submit}
                  style={{
                    width: '100%',
                    marginTop: 20,
                    padding: '16px 0',
                    borderRadius: 16,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16.5,
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    color: '#221A38',
                    background: 'linear-gradient(135deg,#C9B6F0,#FFB69E)',
                    boxShadow: '0 10px 26px rgba(183,156,255,.3)',
                  }}
                >
                  {UI_JA.submit}
                </button>
                {error && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#FF9E82', textAlign: 'center' }}>{error}</div>
                )}
              </div>

              <p style={{ marginTop: 18, fontSize: 11.5, color: 'var(--v2-ink-mute)', lineHeight: 1.6, textAlign: 'center' }}>
                {UI_JA.disclaimer}
              </p>
            </>
          ) : (
            <ResultView spirit={result} card={card} onRetry={() => setResult(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

function ResultView({ spirit, card, onRetry }: { spirit: Spirit; card: PreparedJaCard | null; onRetry: () => void }) {
  const nameJa = spiritNameJa(spirit.elemKey, spirit.zodKey);
  const rarity = RARITY_JA[spirit.rarity.key];
  const img = spiritImgJa(spirit.key);
  const stars = '★'.repeat(spirit.rarity.stars) + '☆'.repeat(4 - spirit.rarity.stars);

  return (
    <div style={{ paddingTop: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-butter)', letterSpacing: 1.5 }}>
        {UI_JA.resultKicker}
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: 14,
          height: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${spirit.elem.raw}44 0%, ${spirit.elem.raw}14 55%, transparent 75%)`,
          }}
        />
        {img ? (
          <img
            src={img}
            alt={nameJa}
            style={{ position: 'relative', width: 260, height: 260, objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div style={{ position: 'relative', fontSize: 140, lineHeight: 1 }}>{spirit.zod.emoji}</div>
        )}
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, color: spirit.rarity.raw, marginTop: 4 }}>
        {stars} {rarity.label}
      </div>
      <h1 style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{nameJa}</h1>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-butter)', marginTop: 8 }}>
        {spirit.elem.cn} + {ZODIAC_JA[spirit.zodKey].word}（{spirit.zod.cn}） · {titleJa(spirit.elemKey, spirit.zodKey)}
      </div>

      <div
        style={{
          marginTop: 18,
          padding: '16px 18px',
          borderRadius: 18,
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.12)',
          fontSize: 14.5,
          lineHeight: 1.75,
          color: 'var(--v2-ink-mid)',
          textAlign: 'left',
        }}
      >
        {personaJa(spirit.elemKey, spirit.zodKey)}
        {rarity.desc && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.1)', fontSize: 13.5, color: 'var(--v2-ink-dim)' }}>
            {rarity.desc}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          track('share_click', { spirit: spirit.key, rarity: spirit.rarity.key });
          void shareJaCard(spirit, card).then((r) => track('share_result', { result: r }));
        }}
        style={{
          width: '100%',
          marginTop: 18,
          padding: '16px 0',
          borderRadius: 16,
          border: 'none',
          cursor: 'pointer',
          fontSize: 16.5,
          fontWeight: 800,
          fontFamily: 'inherit',
          color: '#221A38',
          background: 'linear-gradient(135deg,#C9B6F0,#FFB69E)',
          boxShadow: '0 10px 26px rgba(183,156,255,.3)',
          opacity: card ? 1 : 0.6,
        }}
      >
        {UI_JA.shareBtn}
      </button>

      {/* 성장 티저 — 다음 단계 수요 측정용 */}
      <div
        style={{
          marginTop: 16,
          padding: '16px 18px',
          borderRadius: 18,
          background: 'rgba(255,210,122,.09)',
          border: '1px solid rgba(255,210,122,.28)',
          textAlign: 'left',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-butter)' }}>🌱 {UI_JA.teaserTitle}</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--v2-ink-mid)', marginTop: 6 }}>
          {UI_JA.teaserBody}
        </div>
      </div>

      <button
        onClick={onRetry}
        style={{
          marginTop: 16,
          padding: '12px 26px',
          borderRadius: 999,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 800,
          fontFamily: 'inherit',
          background: 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.16)',
          color: 'var(--v2-ink-dim)',
        }}
      >
        {UI_JA.retryBtn}
      </button>

      <p style={{ marginTop: 22, fontSize: 11, color: 'var(--v2-ink-mute)', lineHeight: 1.7, textAlign: 'left' }}>
        {UI_JA.disclaimerEntertainment}
        <br />
        {UI_JA.disclaimer}
      </p>
      <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--v2-ink-mute)' }}>{UI_JA.footer}</div>
    </div>
  );
}
