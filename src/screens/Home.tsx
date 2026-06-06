import { useEffect, useMemo } from "react";
import { IECopy, IELogo, Reveal, Sparkle } from "../components/ie";
import { SpiritPetHero } from "../components/SpiritPet";
import { useRouter, ScreenId } from "../lib/router";
import { useSaju } from "../lib/saju-state";
import { todayFortune } from "../lib/today";
import { preloadRewardedAdForResult } from "../lib/ads";
import { spiritFromMyeongsik } from "../lib/spirit-pet";

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
  const fortune = myeongsik ? todayFortune(myeongsik, today) : null;
  const spirit = useMemo(() => spiritFromMyeongsik(myeongsik), [myeongsik]);

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
      icon: "日",
      title: "오늘의 운세",
      sub: "데일리 풀이",
      color: "#FF9E82",
    },
    {
      id: "month",
      icon: "月",
      title: "이달의 운세",
      sub: "한 달 흐름 + 좋은 날",
      color: "#B79CFF",
    },
    {
      id: "year",
      icon: "年",
      title: "신년운세",
      sub: "한 해의 흐름",
      color: "#FFD27A",
    },
    {
      id: "saju",
      icon: "命",
      title: "내 사주 명식",
      sub: "8자 깊이 풀이",
      color: "#D6C6FF",
    },
    {
      id: "personality",
      icon: "心",
      title: "성격 카드",
      sub: "내 성향·관계 포인트",
      color: "#B79CFF",
    },
    {
      id: "love",
      icon: "緣",
      title: "연애운",
      sub: "끌리는 사람 스타일·인연 시기",
      color: "#FF9ED2",
    },
    {
      id: "gunghap",
      icon: "合",
      title: "궁합",
      sub: "둘이 어울리는지",
      color: "#FF9ED2",
    },
    {
      id: "money",
      icon: "財",
      title: "재물운",
      sub: "돈 들어오는 흐름",
      color: "#5BD9AC",
    },
    {
      id: "career",
      icon: "業",
      title: "직업운",
      sub: "어울리는 일·적성",
      color: "#7BA8FF",
    },
    {
      id: "health",
      icon: "身",
      title: "건강운",
      sub: "몸의 결·약한 부위",
      color: "#5BD9AC",
    },
  ];

  return (
    <div
      className="ie-screen v2-cosmos-bg"
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
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: -0.4,
                  color: "var(--v2-ink)",
                }}
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
                  stroke="var(--v2-ink-mid)"
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
                  stroke="var(--v2-ink-mid)"
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
                  background: "var(--v2-glass)",
                  border: "1px solid var(--v2-glass-line)",
                marginBottom: 10,
                cursor: "pointer",
                fontFamily: "var(--cp-font)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--v2-ink-dim)" }}>
                지금
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--v2-lavender)",
                  letterSpacing: -0.2,
                }}
              >
                {activeProfile?.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--v2-ink-dim)" }}>
                사주 보는 중
              </span>
              <span style={{ fontSize: 10, color: "var(--v2-ink-dim)" }}>›</span>
            </button>
          )}
        </div>

        {/* 히어로 카드 */}
        <div style={{ padding: "0 20px 20px" }}>
          <Reveal>
            <div
              onClick={() => go("today")}
              style={{
                padding: "18px 18px 20px",
                borderRadius: "var(--v2-r-lg)",
                background:
                  "linear-gradient(180deg, var(--v2-glass-hi), var(--v2-glass))",
                border: "1px solid var(--v2-glass-line2)",
                boxShadow: "var(--v2-shadow)",
                backdropFilter: "blur(14px) saturate(140%)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                minHeight: 420,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(260px 220px at 50% 28%, rgba(183,156,255,.30), transparent 66%), radial-gradient(280px 240px at 82% 18%, rgba(255,158,130,.16), transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <Sparkle
                size={16}
                color="#FFD27A"
                style={{ position: "absolute", top: 44, right: 76, zIndex: 2 }}
              />
              <Sparkle
                size={12}
                color="#B79CFF"
                style={{ position: "absolute", top: 150, left: 42, zIndex: 2 }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1.6,
                      color: "var(--v2-lavender)",
                    }}
                  >
                    {dateStr}
                  </div>
                  <div
                    style={{
                      padding: "5px 9px",
                      borderRadius: 999,
                      border: "1px solid var(--v2-glass-line)",
                      background: "var(--v2-glass)",
                      color: "var(--v2-ink-dim)",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 1,
                    }}
                  >
                    {spirit.lineLabel}
                  </div>
                </div>

                <SpiritPetHero spirit={spirit} style={{ minHeight: 226, marginTop: 8 }} />

                <div style={{ textAlign: "center", marginTop: 2 }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: -0.7,
                      color: "var(--v2-ink)",
                      lineHeight: 1.25,
                    }}
                  >
                    {copy.todayTitle}
                    <br />
                    <span style={{ color: "var(--v2-lavender)" }}>
                      {fortune?.mood ?? copy.todayMood}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--v2-ink-mid)",
                      margin: "14px 0 0",
                      lineHeight: 1.5,
                      wordBreak: "keep-all",
                    }}
                  >
                    {fortune?.oneLine ?? copy.todayLine}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 9,
                    marginTop: 18,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--v2-ink)",
                      background: "var(--v2-glass)",
                      border: "1px solid var(--v2-glass-line2)",
                      padding: "10px 12px",
                      borderRadius: 999,
                      textAlign: "center",
                    }}
                  >
                    교감하기
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#1b1230",
                      background: "linear-gradient(135deg, var(--v2-lavender), var(--v2-peach))",
                      padding: "10px 12px",
                      borderRadius: 999,
                      textAlign: "center",
                      boxShadow: "var(--v2-glow-l)",
                    }}
                  >
                    풀이 보기 →
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
            { lbl: "총운", s: fortune?.sections.overall.score ?? 70, c: "#B79CFF" },
            { lbl: "재물", s: fortune?.sections.money.score   ?? 70, c: "#5BD9AC" },
            { lbl: "연애", s: fortune?.sections.love.score    ?? 70, c: "#FF9ED2" },
            { lbl: "건강", s: fortune?.sections.health.score  ?? 70, c: "#FFD27A" },
          ].map((x) => (
            <div
              key={x.lbl}
              style={{
                flex: "0 0 auto",
                padding: "10px 14px",
                borderRadius: "var(--v2-r-sm)",
                background: "var(--v2-glass)",
                border: "1px solid var(--v2-glass-line2)",
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
                  color: "var(--v2-ink-dim)",
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
              fontSize: 11,
              fontWeight: 800,
              color: "var(--v2-ink-dim)",
              marginBottom: 12,
              letterSpacing: 1.6,
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
                    borderRadius: "var(--v2-r-md)",
                    background: "var(--v2-glass)",
                    border: "1px solid var(--v2-glass-line2)",
                    backdropFilter: "blur(14px) saturate(140%)",
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
                      borderRadius: "50%",
                      background: m.color + "20",
                      border: `1.5px solid ${m.color}`,
                      color: m.color,
                      boxShadow: `0 0 24px ${m.color}55`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--v2-serif)",
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    {m.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--v2-ink)",
                      }}
                    >
                      {m.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--v2-ink-dim)",
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
