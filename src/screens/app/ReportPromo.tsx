/**
 * 유료 리포트 안내 카드 — 무료 화면을 다 읽은 직후에 붙인다.
 *
 * 결제 전에 보여줄 게 필요한데, 미리보기를 AI 로 만들면 안 사는 사람 몫의 원가가
 * 그대로 나간다. 그래서 대신 "내 명식으로 만든 목차"를 보여준다.
 * 앱이 이미 계산해둔 값만 쓰기 때문에 원가가 0원이고, 남의 샘플이 아니라 내 것이라
 * "얘가 내 사주를 이미 읽었구나"가 전달된다.
 */
import { useSaju } from '../../lib/saju-state';
import { buildReportOutline } from '../../lib/report-outline';
import { V2Glass, withAlpha } from './_kit';

const GOLD = '#FFD27A';

export default function ReportPromo({ onOpen }: { onOpen: () => void }) {
  const { myeongsik, profile } = useSaju();
  if (!myeongsik || !profile) return null;

  const outline = buildReportOutline(myeongsik, { year: profile.year, gender: profile.gender });

  return (
    <V2Glass
      onClick={onOpen}
      style={{
        marginTop: 24,
        cursor: 'pointer',
        background: `linear-gradient(150deg, ${withAlpha(GOLD, 0.13)}, rgba(183,156,255,.10))`,
        border: `1.5px solid ${withAlpha(GOLD, 0.3)}`,
      }}
    >
      <div style={{ fontSize: 11.5, fontWeight: 800, color: GOLD, letterSpacing: 3 }}>
        정밀 리포트
      </div>

      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.5, marginTop: 10 }}>
        {outline.headline}
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--v2-ink-dim)', lineHeight: 1.6, marginTop: 8 }}>
        다른 화면들이 조각을 하나씩 알려줬다면, 이 리포트는 그 조각들이 어떻게 맞물리는지를 씁니다.
      </div>

      {/* 목차 — 전부 이 사람 명식에서 뽑은 값이다 */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {outline.chapters.map((ch) => (
          <div key={ch.no}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--v2-ink)' }}>
              {ch.no}장 · {ch.title}
            </div>
            <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {ch.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'baseline' }}>
                  <span style={{ color: withAlpha(GOLD, 0.7), fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 13, color: 'var(--v2-ink-mid)', lineHeight: 1.55 }}>{it}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 18, padding: '13px 16px', borderRadius: 14,
          background: withAlpha(GOLD, 0.16), border: `1px solid ${withAlpha(GOLD, 0.34)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)' }}>전부 읽어보기</span>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: GOLD }}>990원</span>
      </div>
    </V2Glass>
  );
}
