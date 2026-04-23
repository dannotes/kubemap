import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/store';
import { Layout } from './components/Layout';
import { ProfilePage } from './pages/ProfilePage';
import type { PersonCore, PersonDetail, KCDEvent, Stats } from './lib/types';

function DataLoader({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { setPeople, setDetails, setEvents, setStats, setLoading } = useStore.getState();

    async function load() {
      try {
        // Stage 1: Core data + stats + events (what the map/list needs)
        setLoading(true, 'downloading roster…');
        const [coreRes, statsRes, eventsRes] = await Promise.all([
          fetch('/data/people-core.json'),
          fetch('/data/stats.json'),
          fetch('/data/events.json'),
        ]);
        const people: PersonCore[] = await coreRes.json();
        const stats: Stats = await statsRes.json();
        const events: KCDEvent[] = await eventsRes.json();

        setLoading(true, 'plotting coordinates…');
        setPeople(people);
        setStats(stats);
        setEvents(events);
        setLoading(false);

        // Stage 2: Detail data (bios, socials) — deferred to idle time
        fetch('/data/people-details.json')
          .then(r => r.json())
          .then((details: Record<string, PersonDetail>) => {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => setDetails(details));
            } else {
              setTimeout(() => setDetails(details), 200);
            }
          })
          .catch(() => {}); // non-critical

        // Prefetch GlobeView chunk so 2D→3D switch is instant
        import('./components/GlobeView').catch(() => {});
      } catch (e) {
        console.error('Failed to load data:', e);
        setLoading(false, 'Failed to load data');
      }
    }
    load();
  }, []);

  return <>{children}</>;
}

function MobileGate({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!isMobile || dismissed) return <>{children}</>;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: 'var(--bg)', padding: 32, textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'linear-gradient(135deg, #326ce5 0%, #38bdf8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 1px rgba(56,189,248,0.35), 0 0 30px rgba(56,189,248,0.3)',
      }}>
        <svg viewBox="0 0 24 24" width={30} height={30} fill="white">
          <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.5 6.5 3.6L12 11.7 5.5 8.1 12 4.5ZM5 9.8l6 3.3v6.9l-6-3.3V9.8Zm14 0v6.9l-6 3.3v-6.9l6-3.3Z" />
        </svg>
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--text)', letterSpacing: '-0.02em' }}>
        kubemap<span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>.io</span>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 300 }}>
        kubemap is best experienced on a desktop or laptop browser for the full interactive map experience.
      </div>
      <button onClick={() => setDismissed(true)} style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: '10px 24px',
        borderRadius: 8, cursor: 'pointer',
        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
        color: 'var(--accent)',
      }}>
        Continue anyway
      </button>
    </div>
  );
}

export default function App() {
  const theme = useStore(s => s.theme);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <MobileGate>
        <DataLoader>
          <Routes>
            <Route path="/" element={<Layout />} />
            <Route path="/k/:slug" element={<ProfilePage />} />
          </Routes>
        </DataLoader>
      </MobileGate>
    </BrowserRouter>
  );
}
