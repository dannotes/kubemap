import { useState, useMemo, memo } from 'react';
import L from 'leaflet';
import { useStore } from '../store/store';
import { avColor, initials, imageUrl } from '../lib/utils';
import { useIsMobile } from '../lib/useIsMobile';

type SideTab = 'overview' | 'spotlight' | 'regions' | 'companies';
type SpotlightTier = 'golden' | 'ambassador' | 'all';

export function Sidebar() {
  const [tab, setTab] = useState<SideTab>('overview');
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const mobileSheet = useStore(s => s.mobileSheet);
  const setMobileSheet = useStore(s => s.setMobileSheet);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {mobileSheet && (
          <div
            onClick={() => setMobileSheet(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 490,
              background: 'rgba(0,0,0,0.5)',
            }}
          />
        )}
        {/* Sheet */}
        <aside style={{
          position: 'fixed', top: 48, left: 0, right: 0, bottom: 56,
          background: 'var(--panel-solid)',
          zIndex: 491,
          display: 'flex', flexDirection: 'column',
          transform: mobileSheet ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
        }}>
          {/* Close handle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px 0 0',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
          </div>
          <div style={{ display: 'flex', padding: '6px 10px 0 10px', gap: 2, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {(['overview', 'spotlight', 'regions', 'companies'] as SideTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: 'transparent', border: 0, padding: '8px 10px 10px',
                color: tab === t ? 'var(--text)' : 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {t === 'overview' ? 'Overview' : t === 'spotlight' ? 'Spotlight' : t === 'regions' ? 'Countries' : 'Companies'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: tab === 'overview' ? 'block' : 'none' }}><OverviewPanel /></div>
            <div style={{ display: tab === 'spotlight' ? 'block' : 'none' }}><SpotlightPanel /></div>
            <div style={{ display: tab === 'regions' ? 'block' : 'none' }}><MemoRegionsPanel /></div>
            <div style={{ display: tab === 'companies' ? 'block' : 'none' }}><MemoCompaniesPanel /></div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <aside style={{
        position: 'fixed', top: 56, left: 0, bottom: 28, width: 340,
        background: 'var(--panel)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        borderRight: '1px solid var(--border)', zIndex: 400,
        display: 'flex', flexDirection: 'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ display: 'flex', padding: '10px 10px 0 10px', gap: 4, borderBottom: '1px solid var(--border)' }}>
          {(['overview', 'spotlight', 'regions', 'companies'] as SideTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'transparent', border: 0, padding: '8px 10px 10px',
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer',
            }}>
              {t === 'overview' ? 'Overview' : t === 'spotlight' ? 'Spotlight' : t === 'regions' ? 'Countries' : 'Companies'}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: tab === 'overview' ? 'block' : 'none' }}><OverviewPanel /></div>
          <div style={{ display: tab === 'spotlight' ? 'block' : 'none' }}><SpotlightPanel /></div>
          <div style={{ display: tab === 'regions' ? 'block' : 'none' }}><MemoRegionsPanel /></div>
          <div style={{ display: tab === 'companies' ? 'block' : 'none' }}><MemoCompaniesPanel /></div>
        </div>
      </aside>
      {/* Toggle button — always visible at sidebar edge, vertically centered */}
      <button onClick={toggleSidebar} style={{
        position: 'fixed', top: '50%', transform: 'translateY(-50%)',
        left: sidebarOpen ? 340 : 0,
        transition: 'left .28s cubic-bezier(.4,0,.2,1)',
        zIndex: 401, width: 20, height: 48, borderRadius: '0 6px 6px 0',
        background: 'var(--panel-solid)', border: '1px solid var(--border)', borderLeft: 0,
        color: 'var(--text-muted)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
          style={{ transform: sidebarOpen ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform .28s' }}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </>
  );
}

function OverviewPanel() {
  const stats = useStore(s => s.stats);
  const people = useStore(s => s.people);
  const events = useStore(s => s.events);
  const setView = useStore(s => s.setView);
  const setSelectedCountry = useStore(s => s.setSelectedCountry);
  const openEvent = useStore(s => s.openEvent);
  const tierMix = useMemo(() => {
    if (!stats || stats.total === 0) return { golden: 0, regular: 0, amb: 0 };
    return {
      golden: (stats.golden / stats.total * 100),
      regular: (stats.regular / stats.total * 100),
      amb: (stats.ambassadors / stats.total * 100),
    };
  }, [stats]);

  const userRegion = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const TZ_MAP: Record<string, string> = {
        'Asia/Kolkata': 'India', 'Asia/Calcutta': 'India',
        'America/New_York': 'United States', 'America/Chicago': 'United States',
        'America/Los_Angeles': 'United States', 'America/Denver': 'United States',
        'Europe/London': 'United Kingdom', 'Europe/Paris': 'France', 'Europe/Berlin': 'Germany',
        'Europe/Amsterdam': 'Netherlands', 'Europe/Stockholm': 'Sweden',
        'Asia/Tokyo': 'Japan', 'Asia/Seoul': 'South Korea', 'Asia/Shanghai': 'China',
        'Asia/Singapore': 'Singapore', 'Asia/Dubai': 'United Arab Emirates',
        'Australia/Sydney': 'Australia', 'Pacific/Auckland': 'New Zealand',
        'America/Toronto': 'Canada', 'America/Sao_Paulo': 'Brazil',
        'Europe/Madrid': 'Spain', 'Europe/Rome': 'Italy', 'Europe/Warsaw': 'Poland',
        'Europe/Oslo': 'Norway', 'Europe/Copenhagen': 'Denmark', 'Europe/Zurich': 'Switzerland',
        'Europe/Istanbul': 'Turkey', 'Africa/Lagos': 'Nigeria', 'Africa/Cairo': 'Egypt',
        'Africa/Johannesburg': 'South Africa', 'Asia/Bangkok': 'Thailand',
        'Asia/Jakarta': 'Indonesia', 'Asia/Manila': 'Philippines',
      };
      const country = TZ_MAP[tz];
      if (!country) return null;
      const sample = people.find(p => p.country === country);
      const here = people.filter(p => p.country === country);
      const goldHere = here.filter(p => p.tier === 'golden').length;
      return { name: country, flag: sample?.flag || '🌐', count: here.length, golden: goldHere };
    } catch { return null; }
  }, [people]);

  if (!stats) return null;

  return (
    <div style={{ padding: '14px 14px 24px' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <StatCard label="Total" value={stats.total} sub="on the map" />
        <StatCard label="★ Golden" value={stats.golden} sub="all 5 certs" gold />
        <StatCard label="Countries" value={stats.countryCount} sub="& counting" />
        <StatCard label="Ambassadors" value={stats.ambassadors} sub="CNCF · on map" accent />
      </div>

      {/* Tier mix */}
      <SectionTitle title="Tier mix" />
      <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-2)', margin: '4px 0 6px' }}>
        <span style={{ width: `${tierMix.golden}%`, background: 'var(--gold-soft)' }} />
        <span style={{ width: `${tierMix.regular}%`, background: 'var(--accent)' }} />
        <span style={{ width: `${tierMix.amb}%`, background: '#c084fc' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--gold-soft)', marginRight: 4 }} />Golden</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginRight: 4 }} />Kubestronaut</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#c084fc', marginRight: 4 }} />Ambassador</span>
      </div>

      {/* Community events */}
      {events.length > 0 && (
        <>
          <SectionTitle title="Community events" style={{ marginTop: 6 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
            {events.slice(0, 5).map(ev => {
              const daysUntil = Math.ceil((new Date(ev.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const countdown = daysUntil > 1 ? `${daysUntil}d` : daysUntil === 1 ? '1d' : daysUntil === 0 ? 'Today' : '';
              return (
                <div key={ev.id}
                  onClick={() => { openEvent(ev.id); setView('map'); (useStore.getState() as any).flyTo(ev.lat, ev.lon, 5); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <span style={{ width: 10, height: 10, transform: 'rotate(45deg)', background: '#22c55e', flexShrink: 0, borderRadius: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ev.title}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      {ev.flag} {ev.city} · {ev.startDate}
                    </div>
                  </div>
                  {countdown && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#22c55e', fontWeight: 600, flexShrink: 0 }}>
                      {countdown}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Your region */}
      <SectionTitle title="Your region" style={{ marginTop: 6 }} />
      <div
        onClick={() => {
          if (userRegion) {
            setSelectedCountry(userRegion.name);
            setView('map');
          }
        }}
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, var(--surface-2)), var(--surface-2))',
          border: '1px solid var(--border-strong)', borderRadius: 10, padding: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          cursor: userRegion ? 'pointer' : 'default',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { if (userRegion) e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 60%, transparent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 28 }}>{userRegion?.flag || '🌐'}</div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {userRegion?.name || 'Global view'}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)' }}>
              {userRegion ? `${userRegion.count} Kubestronaut${userRegion.count !== 1 ? 's' : ''}${userRegion.golden ? ` · ${userRegion.golden} Golden` : ''}` : `${stats.total} across ${stats.countryCount} countries`}
            </div>
            {(() => {
              if (!userRegion) return null;
              const regionEvent = events.find(e => e.country === userRegion.name);
              if (!regionEvent) return null;
              return (
                <div
                  onClick={(e) => { e.stopPropagation(); openEvent(regionEvent.id); setView('map'); (useStore.getState() as any).flyTo(regionEvent.lat, regionEvent.lon, 5); }}
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#22c55e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span style={{ width: 6, height: 6, transform: 'rotate(45deg)', background: '#22c55e', flexShrink: 0 }} />
                  {regionEvent.title} · {regionEvent.startDate}
                </div>
              );
            })()}
          </div>
        </div>
        {userRegion && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--accent)', whiteSpace: 'nowrap', flexShrink: 0 }}>Show →</span>
        )}
      </div>

      {/* About */}
      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.65, margin: '16px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
        A live map of the global Kubestronaut community — powered by the public{' '}
        <a href="https://github.com/cncf/people" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>cncf/people</a> roster.
      </p>
    </div>
  );
}

function SpotlightPanel() {
  const people = useStore(s => s.people);
  const openProfile = useStore(s => s.openProfile);
  const [tier, setTier] = useState<SpotlightTier>('golden');

  const list = useMemo(() => {
    let arr = people.slice();
    if (tier === 'golden') arr = arr.filter(p => p.tier === 'golden');
    else if (tier === 'ambassador') arr = arr.filter(p => p.isAmbassador);
    // 'all' — show all kubestronauts
    arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [people, tier]);

  return (
    <div style={{ padding: '14px 10px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
        <SectionTitle title="Spotlight" />
      </div>
      <div style={{
        display: 'flex', width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 7, padding: 3, marginBottom: 12,
      }}>
        {(['golden', 'ambassador', 'all'] as SpotlightTier[]).map(t => (
          <button key={t} onClick={() => setTier(t)} style={{
            flex: 1,
            background: tier === t ? 'var(--panel-solid)' : 'transparent', border: 0,
            color: tier === t ? (t === 'golden' ? 'var(--gold-soft)' : 'var(--text)') : 'var(--text-muted)',
            padding: '5px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, borderRadius: 5, cursor: 'pointer',
            boxShadow: tier === t ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
          }}>
            {t === 'golden' ? '★ Golden' : t === 'ambassador' ? 'Ambassadors' : 'All'}
          </button>
        ))}
      </div>
      <div>
        {list.map(p => (
          <PersonRow key={p.id} person={p} onClick={() => { openProfile(p.id); (useStore.getState() as any).flyTo(p.lat, p.lon, 5); }} />
        ))}
      </div>
    </div>
  );
}

function RegionsPanel() {
  const people = useStore(s => s.people);
  const selectedCountry = useStore(s => s.selectedCountry);
  const setSelectedCountry = useStore(s => s.setSelectedCountry);

  const countries = useMemo(() => {
    const map: Record<string, { count: number; golden: number; flag: string }> = {};
    for (const p of people) {
      if (p.country === 'Unknown') continue;
      if (!map[p.country]) map[p.country] = { count: 0, golden: 0, flag: p.flag };
      map[p.country].count++;
      if (p.tier === 'golden') map[p.country].golden++;
    }
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [people]);

  const max = countries[0]?.[1].count || 1;

  return (
    <div style={{ padding: '14px 14px 24px' }}>
      <SectionTitle title="By country" />
      {countries.map(([name, v]) => (
        <div key={name}
          onClick={() => {
            const newVal = selectedCountry === name ? null : name;
            setSelectedCountry(newVal);
            if (newVal) {
              const pts = people.filter(p => p.country === newVal);
              if (pts.length) {
                const store = useStore.getState() as any;
                if (store.view !== 'map') store.setView('map');
                // Fit bounds to all people in that country
                setTimeout(() => {
                  const m = (useStore.getState() as any).mapRef;
                  if (m && pts.length) {
                    const bounds = L.latLngBounds(pts.map(p => [p.lat, p.lon]));
                    m.fitBounds(bounds, { paddingTopLeft: [60, 40], paddingBottomRight: [60, 40], maxZoom: 5, animate: false });
                  }
                }, 80);
              }
            } else {
              // Deselected — fly back to global view
              setTimeout(() => {
                const m = (useStore.getState() as any).mapRef;
                if (m) {
                  m.setView([20, 10], 2, { animate: false });
                }
              }, 80);
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 6, cursor: 'pointer',
            background: selectedCountry === name ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : '',
            boxShadow: selectedCountry === name ? 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent)' : 'none',
          }}
          onMouseEnter={e => { if (selectedCountry !== name) e.currentTarget.style.background = 'var(--surface)'; }}
          onMouseLeave={e => { if (selectedCountry !== name) e.currentTarget.style.background = ''; }}
        >
          <span style={{ fontSize: 16 }}>{v.flag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 12, color: 'var(--text)' }}>{name}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)' }}>
                {v.count}{v.golden ? <span style={{ color: 'var(--gold-soft)' }}> · {v.golden}★</span> : ''}
              </span>
            </div>
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(v.count / max * 100).toFixed(1)}%`, background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, transparent))', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompaniesPanel() {
  const people = useStore(s => s.people);
  const selectedCompany = useStore(s => s.selectedCompany);
  const setSelectedCompany = useStore(s => s.setSelectedCompany);

  const companies = useMemo(() => {
    const map: Record<string, { count: number; golden: number }> = {};
    for (const p of people) {
      const co = p.company;
      if (!co) continue;
      if (!map[co]) map[co] = { count: 0, golden: 0 };
      map[co].count++;
      if (p.tier === 'golden') map[co].golden++;
    }
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 60);
  }, [people]);

  const max = companies[0]?.[1].count || 1;

  return (
    <div style={{ padding: '14px 14px 24px' }}>
      <SectionTitle title="Top companies" />
      {companies.map(([name, v], i) => (
        <div key={name}
          onClick={() => {
            const newVal = selectedCompany === name ? null : name;
            setSelectedCompany(newVal);
            if (newVal) {
              const pts = people.filter(p => p.company === newVal);
              if (pts.length) {
                const store = useStore.getState() as any;
                if (store.view !== 'map') store.setView('map');
                setTimeout(() => {
                  const m = (useStore.getState() as any).mapRef;
                  if (m && pts.length) {
                    const bounds = L.latLngBounds(pts.map(p => [p.lat, p.lon]));
                    m.fitBounds(bounds, { padding: [40, 40], maxZoom: 5, animate: false });
                  }
                }, 50);
              }
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 6, cursor: 'pointer',
            background: selectedCompany === name ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : '',
          }}
          onMouseEnter={e => { if (selectedCompany !== name) e.currentTarget.style.background = 'var(--surface)'; }}
          onMouseLeave={e => { if (selectedCompany !== name) e.currentTarget.style.background = ''; }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-faint)', width: 22, textAlign: 'center' }}>{i + 1}</span>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: avColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: '#0b1220', flexShrink: 0 }}>
            {initials(name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)' }}>
                {v.count}{v.golden ? <span style={{ color: 'var(--gold-soft)' }}> · {v.golden}★</span> : ''}
              </span>
            </div>
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(v.count / max * 100).toFixed(1)}%`, background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, transparent))', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PersonRow({ person: p, onClick }: { person: any; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 7, cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: avColor(p.name),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 11.5, color: '#0b1220',
        flexShrink: 0, overflow: 'hidden', position: 'relative',
        boxShadow: p.tier === 'golden' ? '0 0 0 2px rgba(245,158,11,0.65), 0 0 12px rgba(245,158,11,0.5)' : 'none',
      }}>
        {p.image && (
          <img src={imageUrl(p.image)!} alt="" loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        )}
        <span>{initials(p.name)}</span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12.5, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.name}{p.tier === 'golden' ? <span style={{ color: 'var(--gold-soft)' }}> ★</span> : ''}{p.isAmbassador ? <span style={{ fontSize: 8.5, fontWeight: 700, background: 'rgba(168,85,247,0.2)', color: '#c084fc', borderRadius: 3, padding: '1px 4px', marginLeft: 4, verticalAlign: 'middle' }}>A</span> : ''}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.flag} {p.country}{p.company ? ` · ${p.company}` : ''}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, gold, accent }: { label: string; value: number; sub: string; gold?: boolean; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 11px' }}>
      <div style={{ fontSize: 9.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 22, color: gold ? 'var(--gold-soft)' : accent ? 'var(--accent)' : 'var(--text)', marginTop: 2, letterSpacing: '-0.02em' }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>
    </div>
  );
}

const MemoRegionsPanel = memo(RegionsPanel);
const MemoCompaniesPanel = memo(CompaniesPanel);

function SectionTitle({ title, style }: { title: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, ...style }}>
      <h4 style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{title}</h4>
    </div>
  );
}
