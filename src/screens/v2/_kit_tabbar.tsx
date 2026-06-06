import { TABS, type Tab } from './nav';

/** 하단 고정 탭바 — AppChrome 안 absolute bottom (스크롤과 분리). safe-area 반영. */
export function TabBar({ active, switchTab }: { active: Tab; switchTab: (t: Tab) => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingTop: 10,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(180deg, transparent 0%, rgba(14,10,24,.78) 28%, rgba(14,10,24,.96) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(183,156,255,.06)',
      }}
    >
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className="v2-press"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 20px',
              fontFamily: 'var(--v2-font)',
              minWidth: 56,
              position: 'relative',
            }}
          >
            {on && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 2,
                  borderRadius: '0 0 2px 2px',
                  background: 'var(--v2-lavender)',
                  boxShadow: '0 0 8px var(--v2-lavender)',
                }}
              />
            )}
            <span
              style={{
                fontSize: 22,
                lineHeight: 1,
                color: on ? 'var(--v2-lavender)' : 'var(--v2-ink-mute)',
                textShadow: on ? '0 0 16px rgba(183,156,255,.8)' : 'none',
                transform: on ? 'translateY(-1px) scale(1.08)' : 'none',
                transition: 'all .18s cubic-bezier(.4,0,.2,1)',
                display: 'block',
              }}
            >
              {t.ic}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: on ? 800 : 600,
                color: on ? 'var(--v2-ink)' : 'var(--v2-ink-mute)',
                letterSpacing: on ? '-0.1px' : '0',
                transition: 'color .18s',
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 앱 셸: 화면(스크롤 컨테이너)을 채우고 그 위에 고정 탭바를 올린다. route key로 리마운트. */
export function AppChrome({ routeKey, tab, switchTab, children }: { routeKey: string; tab: Tab; switchTab: (t: Tab) => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div key={routeKey} style={{ position: 'absolute', inset: 0 }}>{children}</div>
      <TabBar active={tab} switchTab={switchTab} />
    </div>
  );
}
