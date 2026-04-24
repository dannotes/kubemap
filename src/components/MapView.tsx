import { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { useStore } from '../store/store';
import { jitterOffset } from '../lib/utils';
import { useIsMobile } from '../lib/useIsMobile';
import type { PersonCore, TierFilter } from '../lib/types';

const TILE_URLS: Record<string, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  space: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
};

const TILE_FILTERS: Record<string, string> = {
  dark: 'brightness(0.75) saturate(0.3) contrast(1.1)',
  light: '',
  space: 'brightness(0.55) saturate(0.2) contrast(1.15) hue-rotate(10deg)',
};

export function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const eventMarkersRef = useRef<L.Layer[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const people = useStore(s => s.people);
  const events = useStore(s => s.events);
  const filter = useStore(s => s.filter);
  const setFilter = useStore(s => s.setFilter);
  const showEvents = useStore(s => s.showEvents);
  const setShowEvents = useStore(s => s.setShowEvents);
  const selectedCountry = useStore(s => s.selectedCountry);
  const selectedCompany = useStore(s => s.selectedCompany);
  const openProfile = useStore(s => s.openProfile);
  const openEvent = useStore(s => s.openEvent);
  const view = useStore(s => s.view);
  const theme = useStore(s => s.theme);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [20, 10], zoom: 2, minZoom: 2, maxZoom: 18,
      worldCopyJump: true, zoomControl: true, attributionControl: true,
    });
    const currentTheme = useStore.getState().theme;
    const tileLayer = L.tileLayer(TILE_URLS[currentTheme] || TILE_URLS.dark, {
      subdomains: 'abcd', maxZoom: 19,
      attribution: '© OpenStreetMap · © CARTO',
    }).addTo(map);
    tileLayerRef.current = tileLayer;
    // Apply initial CSS filter
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = TILE_FILTERS[currentTheme] || '';
    }
    mapRef.current = map;
    (useStore.getState() as any).setMapRef(map);

    // Force Leaflet to recalculate container size — fixes Firefox layout timing issue
    // where the container dimensions aren't ready when L.map() first runs
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);

    return () => { map.remove(); mapRef.current = null; (useStore.getState() as any).setMapRef(null); };
  }, []);

  // Swap tiles on theme change + apply CSS filter for dark themes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(TILE_URLS[theme] || TILE_URLS.dark);
    // Apply CSS filter per theme
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = TILE_FILTERS[theme] || '';
    }
  }, [theme]);

  // Invalidate on view switch or sidebar toggle
  const sidebarOpen = useStore(s => s.sidebarOpen);
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 50);
      setTimeout(() => mapRef.current?.invalidateSize(), 320);
    }
  }, [view, sidebarOpen]);

  // Filter people
  const visible = useMemo(() => {
    return people.filter(p => {
      if (selectedCountry && p.country !== selectedCountry) return false;
      if (selectedCompany && p.company !== selectedCompany) return false;
      if (filter === 'all') return true;
      if (filter === 'golden') return p.tier === 'golden';
      if (filter === 'regular') return p.tier === 'regular';
      if (filter === 'ambassador') return p.isAmbassador && p.tier !== 'golden';
      return true;
    });
  }, [people, filter, selectedCountry, selectedCompany]);

  // Build markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || visible.length === 0) return;

    // Clear old
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Bucket by rounded lat/lon
    const buckets = new Map<string, PersonCore[]>();
    for (const p of visible) {
      const key = `${p.lat.toFixed(1)},${p.lon.toFixed(1)}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(p);
    }

    for (const [key, group] of buckets) {
      const [baseLat, baseLon] = key.split(',').map(Number);

      if (group.length === 1) {
        const p = group[0];
        const [dy, dx] = jitterOffset(p.id, 0.08);
        const icon = L.divIcon({
          className: '',
          html: `<div class="pin ${p.tier}"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8],
        });
        const m = L.marker([p.lat + dy, p.lon + dx], { icon }).addTo(map);
        m.on('click', () => openProfile(p.id));
        m.bindTooltip(
          `<b>${p.name}</b> ${p.tier === 'golden' ? '<span style="color:#fbbf24">★</span>' : ''}<br><span style="opacity:.7;font-family:monospace">${p.flag} ${p.country}${p.company ? ' · ' + p.company : ''}</span>`,
          { direction: 'top', offset: [0, -8] }
        );
        markersRef.current.push(m);
      } else {
        const hasGold = group.some(g => g.tier === 'golden');
        const n = group.length;
        const size = n > 50 ? 46 : n > 15 ? 40 : 34;
        const icon = L.divIcon({
          className: '',
          html: `<div class="cluster ${hasGold ? 'gold' : ''}" style="width:${size}px;height:${size}px">${n}</div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        });
        const m = L.marker([baseLat, baseLon], { icon }).addTo(map);
        m.on('click', () => {
          const items = group.map(p =>
            `<div class="cl-row" data-id="${p.id}" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer">
               <span style="width:8px;height:8px;border-radius:50%;background:${p.tier === 'golden' ? '#fbbf24' : p.tier === 'ambassador' ? '#c084fc' : '#38bdf8'}"></span>
               <span style="font-family:'DM Sans',sans-serif;font-weight:600;font-size:12px">${p.name}</span>
               <span style="font-family:monospace;font-size:10.5px;color:#71717a;margin-left:auto">${p.flag}</span>
             </div>`).join('');
          L.popup({ maxWidth: 280, maxHeight: 320, offset: [0, -4] })
            .setLatLng([baseLat, baseLon])
            .setContent(`<div style="min-width:220px;max-height:280px;overflow-y:auto"><div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#71717a;letter-spacing:.12em;text-transform:uppercase;padding:4px 8px 6px">${n} Kubestronauts here</div>${items}</div>`)
            .openOn(map);
          setTimeout(() => {
            document.querySelectorAll('.cl-row').forEach(r => {
              r.addEventListener('mouseenter', () => (r as HTMLElement).style.background = 'rgba(56,189,248,0.12)');
              r.addEventListener('mouseleave', () => (r as HTMLElement).style.background = '');
              r.addEventListener('click', () => {
                map.closePopup();
                openProfile((r as HTMLElement).dataset.id!);
              });
            });
          }, 30);
        });
        const preview = group.slice(0, 6).map(p =>
          `<div style="padding:2px 0">${p.tier === 'golden' ? '★ ' : ''}<b>${p.name}</b></div>`).join('');
        m.bindTooltip(
          `<div style="font-weight:600;margin-bottom:4px">${n} Kubestronauts nearby</div>${preview}${n > 6 ? `<div style="opacity:.6;margin-top:4px">+${n - 6} more</div>` : ''}`,
          { direction: 'top', offset: [0, -size / 2] }
        );
        markersRef.current.push(m);
      }
    }
  }, [visible, openProfile]);

  // Event markers (green diamonds)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old event markers
    eventMarkersRef.current.forEach(m => map.removeLayer(m));
    eventMarkersRef.current = [];

    if (!showEvents || !events.length) return;

    for (const ev of events) {
      const daysUntil = Math.ceil((new Date(ev.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const dateLabel = daysUntil > 0 ? `in ${daysUntil} days` : daysUntil === 0 ? 'Today!' : `${-daysUntil}d ago`;
      const icon = L.divIcon({
        className: '',
        html: `<div class="event-pin"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      });
      const m = L.marker([ev.lat, ev.lon], { icon }).addTo(map);
      m.on('click', () => openEvent(ev.id));
      m.bindTooltip(
        `<b>${ev.title}</b><br><span style="opacity:.7;font-family:monospace">${ev.flag} ${ev.city} · ${ev.startDate} · ${dateLabel}</span>`,
        { direction: 'top', offset: [0, -10] }
      );
      eventMarkersRef.current.push(m);
    }
  }, [events, showEvents, openEvent]);

  // Pulse indicator when a profile is opened
  const profileId = useStore(s => s.profileId);
  const pulseRef = useRef<L.Layer | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Remove old pulse
    if (pulseRef.current) { map.removeLayer(pulseRef.current); pulseRef.current = null; }
    if (!profileId) return;
    const person = people.find(p => p.id === profileId);
    if (!person) return;
    const tierClass = person.tier === 'golden' ? 'pulse-golden' : (person.isAmbassador ? 'pulse-ambassador' : 'pulse-regular');
    const pulseIcon = L.divIcon({
      className: '',
      html: `<div class="pulse-marker ${tierClass}"></div>`,
      iconSize: [40, 40], iconAnchor: [20, 20],
    });
    pulseRef.current = L.marker([person.lat, person.lon], { icon: pulseIcon, interactive: false }).addTo(map);
    return () => {
      if (pulseRef.current && map) { map.removeLayer(pulseRef.current); pulseRef.current = null; }
    };
  }, [profileId, people]);

  // Pulse indicator when an event is selected
  const eventId = useStore(s => s.eventId);
  const eventPulseRef = useRef<L.Layer | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (eventPulseRef.current) { map.removeLayer(eventPulseRef.current); eventPulseRef.current = null; }
    if (!eventId) return;
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    const pulseIcon = L.divIcon({
      className: '',
      html: `<div class="pulse-marker pulse-event"></div>`,
      iconSize: [40, 40], iconAnchor: [20, 20],
    });
    eventPulseRef.current = L.marker([ev.lat, ev.lon], { icon: pulseIcon, interactive: false }).addTo(map);
    return () => {
      if (eventPulseRef.current && map) { map.removeLayer(eventPulseRef.current); eventPulseRef.current = null; }
    };
  }, [eventId, events]);

  const isMobile = useIsMobile();

  const filters: { key: TierFilter; label: string; dot?: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'golden', label: 'Golden', dot: 'var(--gold-soft)' },
    { key: 'regular', label: 'Kubestronaut', dot: 'var(--accent)' },
    { key: 'ambassador', label: 'Ambassador', dot: '#c084fc' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg)',
      }} />

      {/* Filter bar */}
      <div style={{
        position: 'absolute', top: isMobile ? 8 : 12, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 1000, pointerEvents: 'none',
        padding: isMobile ? '0 8px' : 0,
      }}>
        <div style={{
          display: 'inline-flex', background: 'var(--panel-solid)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)', borderRadius: isMobile ? 8 : 10, padding: isMobile ? 3 : 4, pointerEvents: 'auto',
        }}>
          {filters.map(f => {
            const isActive = filter === f.key;
            return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: isActive ? 'var(--surface)' : 'transparent',
              border: 0, color: isActive ? 'var(--text)' : 'var(--text-muted)',
              padding: isMobile ? '5px 8px' : '7px 14px',
              borderRadius: isMobile ? 6 : 7,
              fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 9.5 : 11,
              display: 'inline-flex', alignItems: 'center', gap: isMobile ? 4 : 6, cursor: 'pointer',
              boxShadow: isActive ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
            }}>
              {f.dot && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: f.dot, flexShrink: 0,
                }} />
              )}
              {f.label}
            </button>
            );
          })}
          {events.length > 0 && (
            <>
              <span style={{ width: 1, alignSelf: 'stretch', margin: isMobile ? '3px 1px' : '5px 2px', background: 'var(--border)' }} />
              <button onClick={() => setShowEvents(!showEvents)} style={{
                background: showEvents ? 'var(--surface)' : 'transparent',
                border: 0, color: showEvents ? 'var(--green)' : 'var(--text-muted)',
                padding: isMobile ? '5px 10px' : '7px 14px', borderRadius: isMobile ? 6 : 7,
                fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 10 : 11,
                display: 'inline-flex', alignItems: 'center', gap: isMobile ? 4 : 6, cursor: 'pointer',
                boxShadow: showEvents ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
              }}>
                <span style={{
                  width: isMobile ? 8 : 8, height: isMobile ? 8 : 8, transform: 'rotate(45deg)',
                  background: '#22c55e',
                  boxShadow: showEvents ? '0 0 8px #22c55e' : 'none',
                }} />
                Events
              </button>
            </>
          )}
        </div>
      </div>

      {/* HUD — desktop only */}
      {!isMobile && <HudOverlay visible={visible} />}
    </div>
  );
}

function HudOverlay({ visible }: { visible: PersonCore[] }) {
  const selectedCountry = useStore(s => s.selectedCountry);
  const selectedCompany = useStore(s => s.selectedCompany);
  const setSelectedCountry = useStore(s => s.setSelectedCountry);
  const setSelectedCompany = useStore(s => s.setSelectedCompany);
  const isMobile = useIsMobile();

  const hasFilter = selectedCountry || selectedCompany;
  const regionLabel = selectedCountry || selectedCompany || 'GLOBAL';

  const clearFilter = useCallback(() => {
    setSelectedCountry(null);
    setSelectedCompany(null);
    const m = (useStore.getState() as any).mapRef;
    if (m) {
      m.setView([20, 10], 2, { animate: false });
    }
  }, [setSelectedCountry, setSelectedCompany]);

  return (
    <>
      <div style={{
        position: 'absolute', bottom: isMobile ? 8 : 12, left: isMobile ? 8 : 12,
        right: isMobile ? 8 : 'auto',
        zIndex: 1000, pointerEvents: hasFilter ? 'auto' : 'none',
        fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 9.5 : 10.5, color: 'var(--text-muted)',
        background: 'var(--panel-solid)', backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)', borderRadius: isMobile ? 6 : 8,
        padding: isMobile ? '6px 10px' : '8px 12px',
        display: 'flex', gap: isMobile ? 8 : 14, alignItems: 'center',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}>
        <span><span style={{ color: 'var(--text-faint)' }}>{isMobile ? '' : 'KUBESTRONAUTS '}</span><span style={{ color: 'var(--text)' }}>{visible.length.toLocaleString()}{isMobile ? ' total' : ''}</span></span>
        <span><span style={{ color: 'var(--text-faint)' }}>{isMobile ? '' : 'REGION '}</span><span style={{ color: hasFilter ? 'var(--accent)' : 'var(--text)' }}>{regionLabel}</span></span>
        {hasFilter && (
          <button onClick={clearFilter} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5,
            color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 8px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 9 : 10, display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Global
          </button>
        )}
      </div>
    </>
  );
}
