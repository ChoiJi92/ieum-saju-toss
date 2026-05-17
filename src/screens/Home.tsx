import { useEffect, useMemo } from "react";
import { IECopy, IELogo, MoodOrb, Reveal, Sparkle } from "../components/ie";
import { useRouter, ScreenId } from "../lib/router";
import { useSaju } from "../lib/saju-state";
import { todayFortune } from "../lib/today";
import { preloadRewardedAdForResult } from "../lib/ads";

/**
 * 03 홈 — 프로토타입 ScreenHome 이식 + 광고 모델 적용 (프리미엄 nudge 제거).
 * 히어로 카드(오늘의 운세) + 점수 칩 4 + 메뉴 그리드 (페이월 X).
 */
export default function ScreenHome({ copy }: { copy: IECopy }) {
  const { go } = useRouter();
  const { myeongsik, profiles, activeId } = useSaju();
  const activeProfile = profiles.find((p) => p.id === activeId);
  const showActiveChip = activeProfile && !activeProfile.isSelf;

  // 홈 mount 시점에 리워드 광고 백그라운드 preload — 사용자가 운세 메뉴 누르기 전에 준비
  useEffect(() => {
    preloadRewardedAdForResult().catch(() => {});
  }, []);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 ${
    ["일", "월", "화", "수", "목", "금", "토"][today.getDay()]
  }요일`;

  /** 본인 명식 + 오늘 일진 → 히어로 카드 동적 운세 */
  const fortune = useMemo(
    () => (myeongsik ? todayFortune(myeongsik, today) : null),
    [myeongsik, today.toDateString()],
  );

  type Menu = {
    id: ScreenId;
    icon: string;
    title: string;
    sub: string;
    color: string;
  };
  const menus: Menu[] = [
    {
      id: "today",
      icon: "☁️",
      title: "오늘의 운세",
      sub: "데일리 풀이",
      color: "#FF8B6C",
    },
    {
      id: "month",
      icon: "🗓️",
      title: "이달의 운세",
      sub: "한 달 흐름 + 좋은 날",
      color: "#B89BFF",
    },
    {
      id: "year",
      icon: "✨",
      title: "신년운세",
      sub: "한 해의 흐름",
      color: "#FFC857",
    },
    {
      id: "saju",
      icon: "🔮",
      title: "내 사주 명식",
      sub: "8자 깊이 풀이",
      color: "#9D7BFF",
    },
    {
      id: "love",
      icon: "💞",
      title: "연애운",
      sub: "끌리는 타입·인연 시기",
      color: "#FF8FB1",
    },
    {
      id: "gunghap",
      icon: "💕",
      title: "궁합",
      sub: "둘이 어울리는지",
      color: "#F495C9",
    },
    {
      id: "money",
      icon: "💰",
      title: "재물운",
      sub: "돈 들어오는 흐름",
      color: "#3DC795",
    },
    {
      id: "career",
      icon: "💼",
      title: "직업운",
      sub: "어울리는 일·적성",
      color: "#4A90E2",
    },
    {
      id: "health",
      icon: "🍃",
      title: "건강운",
      sub: "몸의 결·약한 부위",
      color: "#6FCFC9",
    },
  ];

  return (
    <div
      className="ie-screen"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div className="ie-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {/* 헤더 */}
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IELogo size={32} />
              <span
                style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4 }}
              >
                이음사주
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => go("profiles")}
                style={{
                  background: "transparent",
                  border: "none",
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="사주 프로필"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="var(--cp-text-mid)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 21c0-3 3-5 6-5s6 2 6 5" />
                  <circle cx="17" cy="9" r="2.4" />
                  <path d="M13 21c0-2.5 2-4 4-4s4 1.5 4 4" />
                </svg>
              </button>
              <button
                onClick={() => go("settings")}
                style={{
                  background: "transparent",
                  border: "none",
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="var(--cp-text-mid)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 활성 사주 칩 — 본인 아닐 때만 */}
          {showActiveChip && (
            <button
              onClick={() => go("profiles")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                background: "var(--cp-bg-paper)",
                border: "1.5px solid var(--cp-lavender)",
                marginBottom: 10,
                cursor: "pointer",
                fontFamily: "var(--cp-font)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cp-text-mid)" }}>
                지금
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--cp-lavender)",
                  letterSpacing: -0.2,
                }}
              >
                {activeProfile?.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cp-text-mid)" }}>
                사주 보는 중
              </span>
              <span style={{ fontSize: 10, color: "var(--cp-text-dim)" }}>›</span>
            </button>
          )}
        </div>

        {/* 히어로 카드 */}
        <div style={{ padding: "0 20px 20px" }}>
          <Reveal>
            <div
              onClick={() => go("today")}
              style={{
                padding: 24,
                borderRadius: "var(--cp-radius-xl)",
                background: "linear-gradient(135deg, #C9B6F0 0%, #FFB69E 100%)",
                boxShadow: "0 12px 28px rgba(157,123,255,0.28)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                minHeight: 200,
              }}
            >
              {/* MoodOrb — 카드 안쪽 우상단, 살짝 작게 */}
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  right: 20,
                  pointerEvents: "none",
                }}
              >
                <MoodOrb size={120} />
              </div>

              {/* Sparkle — MoodOrb 좌측 위 */}
              <Sparkle
                size={16}
                color="#FFC857"
                style={{ position: "absolute", top: 36, right: 132, zIndex: 2 }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* 본문 — MoodOrb 회피 위해 paddingRight */}
                <div style={{ paddingRight: 120 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1,
                      color: "var(--cp-text-mid)",
                    }}
                  >
                    {dateStr}
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      marginTop: 6,
                      letterSpacing: -0.6,
                      color: "var(--cp-text)",
                      lineHeight: 1.25,
                    }}
                  >
                    {copy.todayTitle}
                    <br />
                    <span style={{ color: "var(--cp-lavender)" }}>
                      {fortune?.mood ?? copy.todayMood}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--cp-text-mid)",
                      margin: "14px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {fortune?.oneLine ?? copy.todayLine}
                  </p>
                </div>

                {/* 자세히 보기 — paddingRight 영향 X, 카드 우측 끝 정렬 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--cp-text)",
                      background: "rgba(255,255,255,0.7)",
                      padding: "8px 14px",
                      borderRadius: 999,
                      boxShadow: "0 2px 6px rgba(80,60,110,0.08)",
                    }}
                  >
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 점수 칩 */}
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            gap: 8,
            overflowX: "auto",
          }}
          className="ie-scroll"
        >
          {[
            { lbl: "총운", s: fortune?.sections.overall.score ?? 70, c: "#9D7BFF" },
            { lbl: "재물", s: fortune?.sections.money.score   ?? 70, c: "#3DC795" },
            { lbl: "연애", s: fortune?.sections.love.score    ?? 70, c: "#F495C9" },
            { lbl: "건강", s: fortune?.sections.health.score  ?? 70, c: "#FFC857" },
          ].map((x) => (
            <div
              key={x.lbl}
              style={{
                flex: "0 0 auto",
                padding: "10px 14px",
                borderRadius: 14,
                background: "var(--cp-bg-paper)",
                border: "1px solid var(--cp-border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 90,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: x.c,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--cp-text-dim)",
                  fontWeight: 700,
                }}
              >
                {x.lbl}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: x.c,
                  marginLeft: "auto",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {x.s}
              </span>
            </div>
          ))}
        </div>

        {/* 메뉴 그리드 */}
        <div style={{ padding: "0 20px 32px" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--cp-text-mid)",
              marginBottom: 12,
              letterSpacing: 0.3,
            }}
          >
            다른 풀이
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {menus
              .filter((m) => m.id !== "today")
              .map((m) => (
                <div
                  key={m.id}
                  onClick={() => go(m.id)}
                  style={{
                    padding: 16,
                    borderRadius: "var(--cp-radius-lg)",
                    background: "var(--cp-bg-paper)",
                    border: "1px solid var(--cp-border)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 10,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: m.color + "20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {m.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--cp-text)",
                      }}
                    >
                      {m.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--cp-text-dim)",
                        fontWeight: 500,
                        marginTop: 2,
                      }}
                    >
                      {m.sub}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ⚠️ 광고 모델: 프리미엄 nudge 카드 제거 (Phase A 결정) */}
      </div>
    </div>
  );
}
