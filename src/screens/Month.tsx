import { useMemo, useState } from 'react';
import { IECard, IETopBar, OHAENG, ScoreRow } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { RewardedAdGate } from '../components/RewardedAdGate';
import { monthForecast } from '../lib/month';

const MONTH_LABEL = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function ScreenMonth() {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);
  const [openAction, setOpenAction] = useState<number | null>(null);
  const today = useMemo(() => new Date(), []);

  const forecast = useMemo(
    () => (myeongsik ? monthForecast(myeongsik, today) : null),
    [myeongsik, today]
  );

  const monthPlan = useMemo(() => {
    if (!forecast || !forecast.fields?.length) return null;

    const top = forecast.fields.reduce((a, b) => (b.score > a.score ? b : a), forecast.fields[0]);
    const low = forecast.fields.reduce((a, b) => (b.score < a.score ? b : a), forecast.fields[0]);
    const sorted = [...forecast.fields].sort((a, b) => b.score - a.score);

    const missionMap: Record<string, { start: string; keep: string; finish: string }> = {
      총운: {
        start: '이번 달 1주차에 가장 중요한 목표 1개를 정하고, 시작일을 달력에 고정하세요.',
        keep: '주 1회(예: 일요일 밤) 진행 상황을 3줄로 점검해 흐름을 유지하세요.',
        finish: '월말에는 완료한 것 3가지를 적고 다음 달로 넘길 1가지만 남기세요.',
      },
      '일·커리어': {
        start: '초반 10일 안에 가장 영향 큰 업무 1개를 먼저 끝내세요.',
        keep: '회의/보고 전 핵심 2줄 요약 습관으로 전달력을 유지하세요.',
        finish: '월말에 성과 근거(숫자/사례) 3개를 정리해 다음 기회를 준비하세요.',
      },
      연애: {
        start: '이번 달 초에 먼저 연락할 사람 1명을 정하고 짧은 안부를 보내세요.',
        keep: '주 1회는 감정보다 사실 중심으로 대화해 오해를 줄이세요.',
        finish: '월말에 관계에서 좋았던 장면 1개를 다시 표현해 따뜻하게 마무리하세요.',
      },
      재물: {
        start: '월초에 고정지출/변동지출 한도를 먼저 숫자로 정하세요.',
        keep: '결제 전 10초 멈춤 규칙으로 충동 지출을 관리하세요.',
        finish: '월말에 절약/과소비 항목 1개씩만 기록해 다음 달 기준을 만드세요.',
      },
    };

    const cautionMap: Record<string, string> = {
      총운: '이번 달은 동시에 여러 목표를 벌리기보다, 하나씩 끝내는 방식이 유리해요.',
      '일·커리어': '피로한 상태의 즉답·즉결은 손해가 될 수 있어요. 메모 후 답변하세요.',
      연애: '감정이 올라온 날엔 단정적인 말투를 피하고, 한 박자 쉬고 말해주세요.',
      재물: '할인·한정 문구만 보고 바로 결제하지 말고 하루만 더 확인하세요.',
    };

    const weekFocus = [
      `1주차: ${sorted[0].lbl}에 시간을 먼저 배치하세요.`,
      `2주차: ${sorted[1]?.lbl ?? sorted[0].lbl} 루틴을 가볍게 반복하세요.`,
      `3주차: ${low.lbl}는 결정 속도를 늦추고 점검 중심으로 가세요.`,
      `4주차: ${top.lbl} 성과 1개를 정리해 다음 달로 연결하세요.`,
    ];

    const monthlyChecklist = [
      `좋은 날(${forecast.bestDay.day}일)엔 중요한 약속/결정을 배치하세요.`,
      `주의할 날(${forecast.worstDay.day}일)엔 큰 결정보다 유지 업무로 운영하세요.`,
      `${top.lbl} 관련 완료 항목 1개를 꼭 기록으로 남겨주세요.`,
    ];

    const scoreCommentary = [
      `${top.lbl}(${top.score}점)은 이번 달에 가장 밀어주기 좋은 파트예요. 시간과 에너지를 먼저 배치하세요.`,
      `${low.lbl}(${low.score}점)은 속도보다 점검이 중요한 파트예요. 급하게 밀어붙이지 않는 게 이득이에요.`,
      `총점 ${forecast.monthScore}점 기준으로, 이번 달은 "${forecast.mood}" 흐름이에요. ${forecast.tagline}`,
    ];

    const weeklyRhythm = [
      `월초(1~7일): ${top.lbl} 관련 시작 버튼을 누르기 좋은 구간`,
      `중반(8~21일): 루틴 유지 + 작은 피드백 반영으로 안정화`,
      `월말(22일~): ${low.lbl} 리스크 줄이기 + 다음 달 예약 1개`,
    ];

    return {
      topLabel: top.lbl,
      lowLabel: low.lbl,
      missions: missionMap[top.lbl] ?? missionMap.총운,
      caution: cautionMap[low.lbl] ?? cautionMap.총운,
      monthClosing: `${top.lbl} 흐름을 다음 달에도 이어가기 위해, 월말 마지막 날에 같은 행동 1개를 미리 예약해두세요.`,
      weekFocus,
      monthlyChecklist,
      scoreCommentary,
      weeklyRhythm,
    };
  }, [forecast]);

  if (!adDone)
    return (
      <RewardedAdGate
        title="이달의 운세 보기"
        description="이달의 흐름과 좋은 날을 보려면 리워드 광고를 시청해주세요."
        onCancel={back}
        onUnlocked={() => setAdDone(true)}
      />
    );

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title="이달의 운세" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        {/* 본인 정보 칩 */}
        {profile && myeongsik && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'var(--cp-bg-paper)',
                border: '1px solid var(--cp-border)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--cp-text-mid)',
              }}
            >
              <span>{profile.name}</span>
              <span style={{ color: 'var(--cp-text-mute)' }}>·</span>
              <strong style={{ color: OHAENG[myeongsik.ilgan.ohaeng].c, fontSize: 12 }}>
                {myeongsik.ilgan.c}
                {OHAENG[myeongsik.ilgan.ohaeng].cn}
              </strong>
            </span>
          </div>
        )}

        {/* 히어로 점수 카드 */}
        <IECard pop>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'rgba(42,35,51,0.7)',
                  letterSpacing: 1,
                }}
              >
                {MONTH_LABEL[today.getMonth()]} 이달의 운세
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 2px 12px rgba(80,60,110,0.3)',
                  marginTop: 4,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {forecast?.monthScore ?? 0}점
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2A2333', marginTop: 4 }}>
                {forecast?.mood ?? '평이'} · {forecast?.tagline ?? ''}
              </div>
            </div>
            <span style={{ fontSize: 60 }}>🗓️</span>
          </div>
        </IECard>

        {/* 한 달 흐름 풀이 */}
        {forecast?.monthBody && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>이번 달 흐름</div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {forecast.monthBody}
            </p>
          </IECard>
        )}

        {/* 4분야 */}
        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>분야별 흐름</div>
          {(forecast?.fields ?? []).map((x, i, arr) => (
            <div
              key={x.lbl}
              style={{
                paddingBottom: i < arr.length - 1 ? 10 : 0,
                marginBottom: i < arr.length - 1 ? 10 : 0,
                borderBottom: i < arr.length - 1 ? '1px solid var(--cp-border)' : 'none',
              }}
            >
              <ScoreRow icon={x.ic} label={x.lbl} score={x.score} color={x.color} />
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--cp-text-dim)',
                  lineHeight: 1.5,
                  margin: '2px 0 0 48px',
                  fontWeight: 600,
                }}
              >
                {x.oneLine}
              </p>
            </div>
          ))}
        </IECard>

        {/* best / worst day */}
        {forecast && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <DayCard
              label="좋은 날"
              day={forecast.bestDay.day}
              score={forecast.bestDay.score}
              hint={forecast.bestDay.hint}
              color="#3DC795"
              icon="✨"
            />
            <DayCard
              label="주의할 날"
              day={forecast.worstDay.day}
              score={forecast.worstDay.score}
              hint={forecast.worstDay.hint}
              color="#FF8B6C"
              icon="⚠️"
            />
          </div>
        )}

        {/* 키워드 */}
        {forecast?.keywords && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>이달의 포인트</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {forecast.keywords.map((k) => (
                <span
                  key={k}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: '#B89BFF20',
                    color: '#9D7BFF',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </IECard>
        )}

        {/* 행동 가이드 — 클릭 시 상세 펼치기 */}
        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>이번 달 행운 행동</div>
          {(forecast?.actions ?? []).map((x, i) => {
            const open = openAction === i;
            return (
              <div
                key={x.lbl}
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--cp-border)',
                }}
              >
                <button
                  onClick={() => setOpenAction(open ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: '#B89BFF20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {x.ic}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cp-text)' }}>{x.lbl}</div>
                    <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                      {x.sub}
                    </div>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="var(--cp-text-dim)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: 'transform 0.2s',
                      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {open && (
                  <div
                    style={{
                      padding: '4px 0 14px 44px',
                      fontSize: 13,
                      color: 'var(--cp-text-mid)',
                      lineHeight: 1.65,
                    }}
                  >
                    {x.detail}
                  </div>
                )}
              </div>
            );
          })}
        </IECard>

        {monthPlan && (
          <div style={{ marginTop: 16, fontSize: 11, fontWeight: 800, color: 'var(--cp-text-dim)', letterSpacing: 0.4 }}>
            핵심 리포트
          </div>
        )}

        {monthPlan && (
          <IECard style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
              <span>📊</span>
              <span>점수 해설 리포트</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {monthPlan.scoreCommentary.map((line, idx) => (
                <li key={`sc-${idx}`} style={{ fontSize: 13, color: 'var(--cp-text-mid)', lineHeight: 1.55 }}>
                  {line}
                </li>
              ))}
            </ul>
          </IECard>
        )}

        {monthPlan && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
              <span>🗺️</span>
              <span>월간 운영 리듬</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {monthPlan.weeklyRhythm.map((line, idx) => (
                <li key={`wr-${idx}`} style={{ fontSize: 13, color: 'var(--cp-text-mid)', lineHeight: 1.55 }}>
                  {line}
                </li>
              ))}
            </ul>
          </IECard>
        )}

        {monthPlan && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
              <span>📆</span>
              <span>주차별 흐름 캘린더</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {monthPlan.weekFocus.map((line, idx) => (
                <li key={`wf-${idx}`} style={{ fontSize: 13, color: 'var(--cp-text-mid)', lineHeight: 1.55 }}>
                  {line}
                </li>
              ))}
            </ul>
          </IECard>
        )}

        {monthPlan && (
          <div style={{ marginTop: 16, fontSize: 11, fontWeight: 800, color: 'var(--cp-text-dim)', letterSpacing: 0.4 }}>
            실행 가이드
          </div>
        )}

        {monthPlan && (
          <IECard style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
              <span>🧭</span>
              <span>이번 달 3단계 미션 ({monthPlan.topLabel} 중심)</span>
            </div>
            <GuideBlock title="시작" emoji="🚀" items={[monthPlan.missions.start]} />
            <GuideBlock title="유지" emoji="🗓️" items={[monthPlan.missions.keep]} />
            <GuideBlock title="마무리" emoji="✅" items={[monthPlan.missions.finish]} />
          </IECard>
        )}

        {monthPlan && (
          <div style={{ marginTop: 16, fontSize: 11, fontWeight: 800, color: 'var(--cp-text-dim)', letterSpacing: 0.4 }}>
            점검 체크
          </div>
        )}

        {monthPlan && (
          <IECard style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
              <span>✅</span>
              <span>이달 실전 체크리스트</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {monthPlan.monthlyChecklist.map((line, idx) => (
                <li key={`mc-${idx}`} style={{ fontSize: 13, color: 'var(--cp-text-mid)', lineHeight: 1.55 }}>
                  {line}
                </li>
              ))}
            </ul>
          </IECard>
        )}

        {monthPlan && (
          <IECard style={{ marginTop: 14, background: 'linear-gradient(135deg,#FFF3E3 0%, #F4F8FF 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              <span>📝</span>
              <span>월말 체크</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.6 }}>
              이번 달 {monthPlan.lowLabel} 파트 주의 한 줄: {monthPlan.caution}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--cp-text-dim)', lineHeight: 1.55 }}>
              {monthPlan.monthClosing}
            </p>
          </IECard>
        )}
      </div>
    </div>
  );
}

function GuideBlock({ title, emoji, items }: { title: string; emoji: string; items: string[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
        <span>{emoji}</span>
        <span>{title}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`} style={{ fontSize: 13, color: 'var(--cp-text-mid)', lineHeight: 1.55 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayCard({
  label,
  day,
  score,
  hint,
  color,
  icon,
}: {
  label: string;
  day: number;
  score: number;
  hint: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 'var(--cp-radius-lg)',
        background: 'var(--cp-bg-paper)',
        border: '1px solid var(--cp-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>
          {label}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {day}일
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--cp-text-dim)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}점
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--cp-text-mid)', fontWeight: 700, lineHeight: 1.4 }}>
        {hint}
      </div>
    </div>
  );
}
