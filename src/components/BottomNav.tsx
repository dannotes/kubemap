import { useStore } from '../store/store';
import type { ViewMode } from '../lib/types';

interface Tab {
  key: ViewMode;
  label: string;
  svg: string;
}

const TABS: Tab[] = [
  {
    key: 'map', label: 'Map',
    svg: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15M15 6v15"/>',
  },
  {
    key: 'graph', label: 'Graph',
    svg: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="6" cy="14" r="1.5"/><path d="M8 6h8M7 8l4 9M17 8l-4 9M12 16l-6-2"/>',
  },
  {
    key: 'wall', label: 'Wall',
    svg: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  },
  {
    key: 'leaderboard', label: 'Ranks',
    svg: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
  },
  {
    key: 'certs', label: 'Certs',
    svg: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
  },
];

export function BottomNav() {
  const view = useStore(s => s.view);
  const setView = useStore(s => s.setView);

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
      background: 'var(--panel-solid)', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'stretch', zIndex: 500,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {TABS.map(tab => {
        const isActive = tab.key === 'map'
          ? (view === 'map' || view === 'globe')
          : view === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'transparent',
              border: 0, padding: 0,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color .15s ease',
              position: 'relative',
            }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 2, borderRadius: 1,
                background: 'var(--accent)',
              }} />
            )}
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor"
              strokeWidth={isActive ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: tab.svg }}
            />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.02em',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
