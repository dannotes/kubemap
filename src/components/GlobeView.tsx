import { useEffect, useRef, useCallback, useMemo } from 'react';
import Globe from 'globe.gl';
import { useStore } from '../store/store';
import { useIsMobile } from '../lib/useIsMobile';

const GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function pointColor(d: any): string {
  if (d._isEvent) return '#22c55e';
  if (d.tier === 'golden') return '#fbbf24';
  if (d.isAmbassador) return '#c084fc';
  return '#38bdf8';
}

export function GlobeView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const geoRef = useRef<any>(null);
  const people = useStore(s => s.people);
  const events = useStore(s => s.events);
  const showEvents = useStore(s => s.showEvents);
  const openProfile = useStore(s => s.openProfile);
  const openEvent = useStore(s => s.openEvent);
  const theme = useStore(s => s.theme);
  const filter = useStore(s => s.filter);
  const selectedCountry = useStore(s => s.selectedCountry);
  const selectedCompany = useStore(s => s.selectedCompany);
  const isMobile = useIsMobile();

  const visible = useMemo(() => people.filter(p => {
    if (selectedCountry && p.country !== selectedCountry) return false;
    if (selectedCompany && p.company !== selectedCompany) return false;
    if (filter === 'all') return true;
    if (filter === 'golden') return p.tier === 'golden';
    if (filter === 'regular') return p.tier === 'regular';
    if (filter === 'ambassador') return p.isAmbassador && p.tier !== 'golden';
    return true;
  }), [people, filter, selectedCountry, selectedCompany]);

  const handlePointClick = useCallback((point: any) => {
    if (point?._isEvent) openEvent(point.id);
    else if (point?.id) openProfile(point.id);
  }, [openProfile, openEvent]);

  // Init globe
  useEffect(() => {
    if (!containerRef.current) return;
    const isDark = theme !== 'light';

    const globe = new Globe(containerRef.current)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor(isDark ? '#1e3a5f' : '#6b9dff')
      .atmosphereAltitude(0.15)
      .showGlobe(true)
      .globeImageUrl('') // We'll use polygons instead
      // Points config — our data uses 'lon' not 'lng'
      .pointLat('lat')
      .pointLng('lon')
      .pointsMerge(false)
      .pointAltitude((d: any) => d._isEvent ? 0.04 : d.tier === 'golden' ? 0.04 : 0.01)
      .pointRadius((d: any) => d._isEvent ? 0.8 : d.tier === 'golden' ? 0.55 : 0.35)
      .pointColor(pointColor)
      .onPointClick(handlePointClick)
      .pointLabel((d: any) => `
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;background:rgba(10,15,30,0.95);padding:8px 12px;border-radius:8px;border:1px solid rgba(56,189,248,0.3);color:#e2e8f0;max-width:240px;backdrop-filter:blur(8px)">
          <div style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">
            ${d.name}
            ${d.tier === 'golden' ? '<span style="color:#fbbf24;margin-left:4px">★</span>' : ''}
            ${d.isAmbassador ? '<span style="font-size:9px;font-weight:700;background:rgba(168,85,247,0.25);color:#c084fc;border-radius:3px;padding:1px 4px;margin-left:4px;vertical-align:middle">A</span>' : ''}
          </div>
          <div style="color:#94a3b8;font-size:10px">${d.flag} ${d.country}${d.company ? ' · ' + d.company : ''}</div>
        </div>
      `);

    // Globe surface + lighting
    const scene = globe.scene();
    if (scene) {
      scene.traverse((obj: any) => {
        if (obj.type === 'Mesh' && obj.geometry?.type === 'SphereGeometry') {
          obj.material.color.set(isDark ? '#0f1525' : '#b8c8e0');
        }
        // Boost ambient light for light theme so dark side isn't black
        if (obj.type === 'AmbientLight') {
          obj.intensity = isDark ? 0.6 : 1.8;
        }
        if (obj.type === 'DirectionalLight') {
          obj.intensity = isDark ? 0.6 : 0.4;
        }
      });
    }

    // Load country polygons for the vector look
    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then(topoData => {
        // Convert TopoJSON to GeoJSON
        const countries = topojsonFeature(topoData, topoData.objects.countries);
        geoRef.current = countries;

        globe
          .polygonsData(countries.features)
          .polygonCapColor(() => isDark ? '#1c2640' : '#e2eaf5')
          .polygonSideColor(() => isDark ? '#151d30' : '#d0dae8')
          .polygonStrokeColor(() => isDark ? '#2a3a5c' : '#b0bdd4')
          .polygonAltitude(0.005);
      });

    globe.pointOfView({ lat: 20, lng: 10, altitude: 2.2 });

    const controls = globe.controls() as any;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;

      // Stop auto-rotation on user interaction, resume after 5s idle
      const stopRotation = () => {
        controls.autoRotate = false;
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { controls.autoRotate = true; }, 5000);
      };
      const el = containerRef.current;
      if (el) {
        el.addEventListener('mousedown', stopRotation);
        el.addEventListener('wheel', stopRotation);
        el.addEventListener('touchstart', stopRotation);
      }
    }

    globeRef.current = globe;
    (useStore.getState() as any).setGlobeRef(globe);

    const resize = () => {
      if (containerRef.current && globeRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        globeRef.current.width(rect.width);
        globeRef.current.height(rect.height);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (globeRef.current) {
        const renderer = globeRef.current.renderer();
        if (renderer) renderer.dispose();
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
      globeRef.current = null;
      (useStore.getState() as any).setGlobeRef(null);
    };
  }, [theme]);

  // Update points (people + events merged)
  useEffect(() => {
    if (!globeRef.current) return;
    const eventPoints = showEvents ? events.map(e => ({
      ...e, _isEvent: true, tier: 'event', isAmbassador: false, name: e.title,
      flag: e.flag, country: e.city, company: '',
    })) : [];
    globeRef.current.pointsData([...visible, ...eventPoints]);
  }, [visible, events, showEvents]);

  // Update click handler
  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.onPointClick(handlePointClick);
  }, [handlePointClick]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: theme === 'light' ? '#e8eef7' : '#060a14',
      zIndex: 2, overflow: 'hidden',
    }}>
      {/* Starfield background — dark theme only */}
      {theme !== 'light' && <div className="starfield" />}
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />

      {/* Info overlay — desktop only */}
      {!isMobile && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'var(--panel)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: 8,
          padding: '8px 12px',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)',
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <span>{visible.length.toLocaleString()} Kubestronauts</span>
          <span style={{ color: 'var(--text-faint)' }}>drag to rotate · scroll to zoom · click pins</span>
        </div>
      )}
    </div>
  );
}

// Minimal TopoJSON -> GeoJSON converter (avoids adding a dependency)
function topojsonFeature(topology: any, object: any): any {
  const arcs = topology.arcs;
  const transform = topology.transform;

  function decodeArc(arcIdx: number): number[][] {
    const isReversed = arcIdx < 0;
    const arc = arcs[isReversed ? ~arcIdx : arcIdx];
    const coords: number[][] = [];
    let x = 0, y = 0;
    for (const [dx, dy] of arc) {
      x += dx;
      y += dy;
      if (transform) {
        coords.push([
          x * transform.scale[0] + transform.translate[0],
          y * transform.scale[1] + transform.translate[1],
        ]);
      } else {
        coords.push([x, y]);
      }
    }
    if (isReversed) coords.reverse();
    return coords;
  }

  function decodeRing(indices: number[]): number[][] {
    const coords: number[][] = [];
    for (const idx of indices) {
      const arc = decodeArc(idx);
      // Skip first point of subsequent arcs (it duplicates last of previous)
      coords.push(...(coords.length > 0 ? arc.slice(1) : arc));
    }
    return coords;
  }

  function decodeGeometry(geom: any): any {
    if (geom.type === 'Polygon') {
      return { type: 'Polygon', coordinates: geom.arcs.map(decodeRing) };
    }
    if (geom.type === 'MultiPolygon') {
      return { type: 'MultiPolygon', coordinates: geom.arcs.map((poly: any) => poly.map(decodeRing)) };
    }
    return geom;
  }

  if (object.type === 'GeometryCollection') {
    return {
      type: 'FeatureCollection',
      features: object.geometries.map((geom: any) => ({
        type: 'Feature',
        properties: geom.properties || {},
        geometry: decodeGeometry(geom),
      })),
    };
  }

  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: object.properties || {}, geometry: decodeGeometry(object) }],
  };
}
