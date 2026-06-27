import { V2Screen, V2TopBar, V2Label, V2Glass, SelfSpiritSlot, SectionCard, BulletList, DomainEmpty, BondMeter, Chip, StatPill, Accordion } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { personalityCard } from '../../lib/personality';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenPersonality({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const f = myeongsik ? personalityCard(myeongsik) : null;
  if (!f) return <DomainEmpty title="성격 분석" back={back} />;
  return (
    <V2Screen seed={38}>
      <V2TopBar onBack={back} title="성격 분석" />

      <V2Glass style={{ textAlign: 'center' }}>
        <SelfSpiritSlot spirit={spirit} size={88} tag={false} />
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--v2-ink)', marginTop: 6 }}>{f.title}</div>
        <div style={{ fontSize: 13, color: 'var(--v2-ink-dim)', marginTop: 4 }}>{f.subtitle}</div>
      </V2Glass>

      {/* ── 오행 분포 ─────────────────────────────────────── */}
      <V2Label>오행 분포</V2Label>
      <V2Glass>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {f.ohaengBars.map((bar) => (
            <BondMeter
              key={bar.key}
              label={`${bar.kr} · ${bar.pulie}`}
              percent={bar.percent}
              color={bar.color}
              sub={bar.count === 0 ? '없음' : undefined}
            />
          ))}
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--v2-ink-mid)' }}>
            <span style={{ fontWeight: 700, color: 'var(--v2-ink)' }}>강한 기운 · </span>
            {f.ohaengComment.strongest}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--v2-ink-mid)' }}>
            <span style={{ fontWeight: 700, color: 'var(--v2-ink)' }}>약한 기운 · </span>
            {f.ohaengComment.weakest}
          </div>
        </div>
      </V2Glass>

      {/* ── 신강신약 ─────────────────────────────────────── */}
      <V2Label>신강신약 · 에너지 유형</V2Label>
      <V2Glass>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-ink)' }}>{f.shinkangSection.label}</span>
          <Chip color="var(--v2-lavender)">{f.shinkangSection.yongshinChip}</Chip>
        </div>
        <BondMeter
          label="신강/신약 게이지"
          percent={f.shinkangSection.gauge}
          color="var(--v2-lavender)"
          sub={`신강(100) ← ${f.shinkangSection.gauge} → 신약(0)`}
        />
        <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>
          {f.shinkangSection.body}
        </div>
        <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.65, color: 'var(--v2-ink-dim)', borderLeft: '2px solid var(--v2-lavender)', paddingLeft: 10 }}>
          {f.shinkangSection.yongshinReason}
        </div>
      </V2Glass>

      {/* ── 나는 ─────────────────────────────────────────── */}
      <div style={{ marginTop: 14 }}>
        <SectionCard title="나는" body={f.identity} />
      </div>

      <V2Label>강점</V2Label>
      <BulletList items={f.strengths} />

      <V2Label>이런 오해를 받아요</V2Label>
      <BulletList items={f.misunderstood} />

      <V2Label>편한 환경</V2Label>
      <BulletList items={f.comfortZone} />

      <V2Label>반복되는 패턴</V2Label>
      <BulletList items={f.patterns} />

      {/* ── 직업/적성 가이드 ──────────────────────────────── */}
      <V2Label>직업 · 적성 가이드</V2Label>
      <Accordion items={f.careerItems} />

      {/* ── 사주 밸런스 진단 ──────────────────────────────── */}
      <V2Label>사주 밸런스 진단</V2Label>
      <V2Glass>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <StatPill label="유형" value={f.balanceDiagnosis.label} color="var(--v2-peach)" />
          <Chip color="var(--v2-peach)">{f.balanceDiagnosis.chip}</Chip>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>
          {f.balanceDiagnosis.advice}
        </div>
      </V2Glass>

      <V2Label>잘 맞는 사람</V2Label>
      <BulletList items={f.goodMatches} />

      <V2Label>조심할 관계</V2Label>
      <BulletList items={f.difficultMatches} />

      <V2Label>대화 팁</V2Label>
      <BulletList items={f.talkTips} />

      <V2Label>나의 루틴</V2Label>
      <BulletList items={f.todayRoutines} />

      <V2Glass style={{ marginTop: 22, textAlign: 'center', background: 'linear-gradient(135deg, rgba(183,156,255,.16), rgba(255,158,130,.12))' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.55 }}>🌙 {f.mantra}</div>
      </V2Glass>

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}
