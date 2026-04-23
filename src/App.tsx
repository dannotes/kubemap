import { useEffect } from 'react';
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

export default function App() {
  const theme = useStore(s => s.theme);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <DataLoader>
        <Routes>
          <Route path="/" element={<Layout />} />
          <Route path="/k/:slug" element={<ProfilePage />} />
        </Routes>
      </DataLoader>
    </BrowserRouter>
  );
}
