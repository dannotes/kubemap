import { useStore } from '../store/store';
import { Search } from './Search';
import type { ViewMode, Theme } from '../lib/types';

const VIEW_ICONS: Record<string, { svg: string; label: string }> = {
  map: {
    svg: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15M15 6v15"/>',
    label: 'Map',
  },
  wall: {
    svg: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    label: 'Wall',
  },
  graph: {
    svg: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="6" cy="14" r="1.5"/><path d="M8 6h8M7 8l4 9M17 8l-4 9M12 16l-6-2"/>',
    label: 'Graph',
  },
  leaderboard: {
    svg: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
    label: 'Ranks',
  },
  certs: {
    svg: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
    label: 'Certs',
  },
};

const THEME_ICONS: Record<Theme, { svg: string; label: string }> = {
  dark: {
    svg: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    label: 'Dark',
  },
  light: {
    svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    label: 'Light',
  },
};

export function TopBar() {
  const { view, setView, theme, setTheme } = useStore();

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 56,
      background: 'var(--panel)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 18px', zIndex: 500,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, #326ce5 0%, #38bdf8 100%)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(56,189,248,0.35), 0 0 20px rgba(56,189,248,0.3)',
        }}>
          <svg viewBox="0 0 24 24" width={18} height={18} fill="white">
            <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.5 6.5 3.6L12 11.7 5.5 8.1 12 4.5ZM5 9.8l6 3.3v6.9l-6-3.3V9.8Zm14 0v6.9l-6 3.3v-6.9l6-3.3Z" />
          </svg>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          kubemap<span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>.io</span>
        </div>
      </div>

      <Search />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {/* View switcher */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 3, gap: 2,
        }}>
          {(Object.keys(VIEW_ICONS) as ViewMode[]).map(v => {
            // "Map" button is active for both map and globe views
            const isActive = v === 'map' ? (view === 'map' || view === 'globe') : view === v;
            return (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={isActive}
              style={{
                background: isActive ? 'var(--panel-solid)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-dim)',
                border: 0, height: 28, padding: '0 12px',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
                borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                letterSpacing: '-0.01em',
                boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.4), inset 0 0 0 1px var(--border-strong)' : 'none',
              }}
            >
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: VIEW_ICONS[v].svg }} />
              {VIEW_ICONS[v].label}
            </button>
            );
          })}
        </div>

        {/* Theme switcher */}
        <div style={{
          display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 3, height: 32,
        }}>
          {(Object.keys(THEME_ICONS) as Theme[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              aria-pressed={theme === t}
              style={{
                background: theme === t ? 'var(--panel-solid)' : 'transparent',
                border: 0, color: theme === t ? 'var(--text)' : 'var(--text-muted)',
                padding: '0 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer',
                boxShadow: theme === t ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: THEME_ICONS[t].svg }} />
              {THEME_ICONS[t].label}
            </button>
          ))}
        </div>

        {/* GitHub */}
        <a
          href="https://github.com/cncf/people"
          target="_blank"
          rel="noopener"
          style={{
            width: 32, height: 32, borderRadius: 7,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-dim)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Data source"
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55 4.56-1.53 7.84-5.83 7.84-10.9C23.5 5.65 18.35.5 12 .5Z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
