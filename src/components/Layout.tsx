import { lazy, Suspense, useEffect } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { MapView } from './MapView';
import { ProfilePanel } from './ProfilePanel';
import { EventPanel } from './EventPanel';
import { LoadingOverlay } from './LoadingOverlay';
import { useStore } from '../store/store';

const GlobeView = lazy(() => import('./GlobeView').then(m => ({ default: m.GlobeView })));
const WallView = lazy(() => import('./WallView').then(m => ({ default: m.WallView })));
const GraphView = lazy(() => import('./GraphView').then(m => ({ default: m.GraphView })));
const LeaderboardView = lazy(() => import('./LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const CertsView = lazy(() => import('./CertsView').then(m => ({ default: m.CertsView })));

export function Layout() {
  const view = useStore(s => s.view);
  const openProfile = useStore(s => s.openProfile);
  const openEvent = useStore(s => s.openEvent);

  // Global Escape to close panels
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { openProfile(null); openEvent(null); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openProfile]);

  const setView = useStore(s => s.setView);

  return (
    <>
      <TopBar />
      <Sidebar />
      <div style={{ display: view === 'map' ? 'block' : 'none' }}>
        <MapView />
      </div>
      <Suspense>
        {view === 'globe' && <GlobeView />}
        {view === 'wall' && <WallView />}
        {view === 'graph' && <GraphView />}
        {view === 'leaderboard' && <LeaderboardView />}
        {view === 'certs' && <CertsView />}
      </Suspense>
      {/* 2D / 3D toggle — visible on map and globe views */}
      {(view === 'map' || view === 'globe') && (
        <div style={{
          position: 'fixed', bottom: 40, right: 16, zIndex: 410,
          display: 'inline-flex', background: 'var(--panel)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)', borderRadius: 8, padding: 3,
        }}>
          <button onClick={() => setView('map')} style={{
            background: view === 'map' ? 'var(--surface)' : 'transparent',
            border: 0, color: view === 'map' ? 'var(--text)' : 'var(--text-muted)',
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
            boxShadow: view === 'map' ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
          }}>2D</button>
          <button onClick={() => setView('globe')} style={{
            background: view === 'globe' ? 'var(--surface)' : 'transparent',
            border: 0, color: view === 'globe' ? 'var(--text)' : 'var(--text-muted)',
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
            boxShadow: view === 'globe' ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
          }}>3D</button>
        </div>
      )}
      <ProfilePanel />
      <EventPanel />
      <LoadingOverlay />
      <StatusBar />
    </>
  );
}
