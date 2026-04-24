import { lazy, Suspense, useEffect } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { BottomNav } from './BottomNav';
import { MapView } from './MapView';
import { ProfilePanel } from './ProfilePanel';
import { EventPanel } from './EventPanel';
import { LoadingOverlay } from './LoadingOverlay';
import { HeroEntrance } from './HeroEntrance';
import { useStore } from '../store/store';
import { useIsMobile } from '../lib/useIsMobile';

const GlobeView = lazy(() => import('./GlobeView').then(m => ({ default: m.GlobeView })));
const WallView = lazy(() => import('./WallView').then(m => ({ default: m.WallView })));
const GraphView = lazy(() => import('./GraphView').then(m => ({ default: m.GraphView })));
const LeaderboardView = lazy(() => import('./LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const CertsView = lazy(() => import('./CertsView').then(m => ({ default: m.CertsView })));

export function Layout() {
  const view = useStore(s => s.view);
  const openProfile = useStore(s => s.openProfile);
  const openEvent = useStore(s => s.openEvent);
  const isMobile = useIsMobile();

  // Global Escape to close panels
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { openProfile(null); openEvent(null); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openProfile]);

  const setView = useStore(s => s.setView);
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const sidebarW = isMobile ? 0 : (sidebarOpen ? 340 : 0);
  const topH = isMobile ? 48 : 56;
  const bottomH = isMobile ? 56 : 28;

  return (
    <>
      <TopBar />
      <Sidebar />
      {/* Content wrapper — all views offset by sidebar width */}
      <div style={{
        position: 'fixed', top: topH, left: sidebarW, right: 0, bottom: bottomH,
        transition: isMobile ? 'none' : 'left .28s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ display: view === 'map' ? 'block' : 'none', position: 'absolute', inset: 0 }}>
          <MapView />
        </div>
        <Suspense>
          {view === 'globe' && <div key="globe" className="view-enter"><GlobeView /></div>}
          {view === 'wall' && <div key="wall" className="view-enter"><WallView /></div>}
          {view === 'graph' && <div key="graph" className="view-enter"><GraphView /></div>}
          {view === 'leaderboard' && <div key="leaderboard" className="view-enter"><LeaderboardView /></div>}
          {view === 'certs' && <div key="certs" className="view-enter"><CertsView /></div>}
        </Suspense>
        <LoadingOverlay />
      </div>
      {/* 2D / 3D toggle — visible on map and globe views */}
      {(view === 'map' || view === 'globe') && (
        <div style={{
          position: 'fixed', bottom: isMobile ? 68 : 40,
          ...(isMobile ? { left: '50%', transform: 'translateX(-50%)' } : { right: 16 }),
          zIndex: 410,
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
      {isMobile ? <BottomNav /> : <StatusBar />}
      <HeroEntrance />
    </>
  );
}
