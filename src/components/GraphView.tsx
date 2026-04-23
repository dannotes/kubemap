import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/store';
import { avColor, initials, imageUrl } from '../lib/utils';
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from 'd3-force';

type GraphMode = 'company' | 'country';

interface HubNode extends SimulationNodeDatum {
  id: string;
  label: string;
  count: number;
  golden: number;
  ambassador: number;
  radius: number;
  flag?: string;
  people: { id: string; name: string; tier: string; isAmbassador: boolean; image: string | null; country: string; flag: string; company: string }[];
}

export function GraphView() {
  const people = useStore(s => s.people);
  const openProfile = useStore(s => s.openProfile);
  const [mode, setMode] = useState<GraphMode>('company');
  const [expandedHub, setExpandedHub] = useState<string | null>(null);
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<HubNode[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; origX: number; origY: number }>({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const animFrameRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Build hub data
  const hubs = useMemo(() => {
    const keyFn = mode === 'company'
      ? (p: any) => (p.company || '').trim()
      : (p: any) => p.country || 'Unknown';

    const map = new Map<string, HubNode>();
    for (const p of people) {
      const k = keyFn(p);
      if (!k || k === 'Unknown') continue;
      if (!map.has(k)) {
        map.set(k, {
          id: k, label: k, count: 0, golden: 0, ambassador: 0, radius: 0,
          flag: mode === 'country' ? p.flag : undefined,
          people: [],
        });
      }
      const hub = map.get(k)!;
      hub.count++;
      if (p.tier === 'golden') hub.golden++;
      if (p.isAmbassador) hub.ambassador++;
      hub.people.push({ id: p.id, name: p.name, tier: p.tier, isAmbassador: p.isAmbassador, image: p.image, country: p.country, flag: p.flag, company: p.company });
    }

    const MIN = mode === 'company' ? 3 : 4;
    const list = [...map.values()]
      .filter(h => h.count >= MIN)
      .sort((a, b) => b.count - a.count)
      .slice(0, 40);

    const maxCount = list[0]?.count || 1;
    for (const h of list) {
      h.radius = 22 + 38 * Math.sqrt(h.count / maxCount);
    }
    return list;
  }, [people, mode]);

  // Force simulation
  useEffect(() => {
    if (!hubs.length) return;
    const w = sizeRef.current.w || 1200;
    const h = sizeRef.current.h || 800;

    // Initialize positions
    const nodes = hubs.map((hub, i) => {
      const angle = (i / hubs.length) * Math.PI * 2;
      const spread = Math.min(w, h) * 0.35;
      return {
        ...hub,
        x: w / 2 + Math.cos(angle) * spread * (0.3 + Math.random() * 0.7),
        y: h / 2 + Math.sin(angle) * spread * (0.3 + Math.random() * 0.7),
      };
    });

    const sim = forceSimulation(nodes)
      .force('center', forceCenter(w / 2, h / 2).strength(0.04))
      .force('charge', forceManyBody().strength(-500))
      .force('collide', forceCollide<HubNode>(d => d.radius + 55).strength(0.9))
      .force('x', forceX(w / 2).strength(0.025))
      .force('y', forceY(h / 2).strength(0.025))
      .alpha(0.8)
      .alphaDecay(0.015);

    nodesRef.current = nodes;

    sim.on('tick', () => {
      nodesRef.current = nodes;
    });

    // Run sim for a bit then stop
    for (let i = 0; i < 200; i++) sim.tick();
    sim.stop();
    nodesRef.current = nodes;

    return () => { sim.stop(); };
  }, [hubs]);

  // Canvas rendering
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const { x: tx, y: ty, k } = transformRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(tx, ty);
    ctx.scale(k, k);

    const nodes = nodesRef.current;
    const isDark = document.body.getAttribute('data-theme') !== 'light';

    // Draw connections between nearby hubs (subtle)
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = isDark ? '#38bdf8' : '#1e40af';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = (a.x || 0) - (b.x || 0), dy = (a.y || 0) - (b.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          ctx.beginPath();
          ctx.moveTo(a.x || 0, a.y || 0);
          ctx.lineTo(b.x || 0, b.y || 0);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Draw each hub
    for (const node of nodes) {
      const cx = node.x || 0;
      const cy = node.y || 0;
      const r = node.radius;
      const isExpanded = expandedHub === node.id;
      const isHovered = hoveredHub === node.id;
      const hasGold = node.golden > 0;

      // Aura glow
      const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.2);
      if (hasGold && node.golden > node.count * 0.2) {
        grad.addColorStop(0, 'rgba(251,191,36,0.18)');
        grad.addColorStop(1, 'rgba(251,191,36,0)');
      } else if (node.ambassador > 0 && mode === 'company') {
        grad.addColorStop(0, 'rgba(168,85,247,0.12)');
        grad.addColorStop(1, 'rgba(168,85,247,0)');
      } else {
        grad.addColorStop(0, isDark ? 'rgba(56,189,248,0.14)' : 'rgba(30,64,175,0.08)');
        grad.addColorStop(1, isDark ? 'rgba(56,189,248,0)' : 'rgba(30,64,175,0)');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Hub circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? (isHovered || isExpanded ? 'rgba(30,40,60,0.95)' : 'rgba(20,28,45,0.85)') : (isHovered || isExpanded ? 'rgba(245,248,255,0.95)' : 'rgba(235,240,250,0.85)');
      ctx.fill();
      ctx.strokeStyle = isExpanded
        ? (hasGold ? 'rgba(251,191,36,0.7)' : isDark ? 'rgba(56,189,248,0.6)' : 'rgba(30,64,175,0.5)')
        : (isHovered
          ? (isDark ? 'rgba(56,189,248,0.4)' : 'rgba(30,64,175,0.3)')
          : (isDark ? 'rgba(71,85,105,0.5)' : 'rgba(148,163,184,0.4)'));
      ctx.lineWidth = isExpanded ? 2 : 1;
      ctx.stroke();

      // Satellite dots (always visible around hub)
      const satCount = Math.min(isExpanded ? 0 : node.people.length, 20);
      for (let i = 0; i < satCount; i++) {
        const p = node.people[i];
        const angle = (i / satCount) * Math.PI * 2 - Math.PI / 2;
        const orbitR = r + 10 + (i % 3) * 6;
        const sx = cx + Math.cos(angle) * orbitR;
        const sy = cy + Math.sin(angle) * orbitR;
        const dotR = p.tier === 'golden' ? 3.5 : 2.5;
        const fill = p.tier === 'golden' ? '#fbbf24' : p.isAmbassador ? '#c084fc' : (isDark ? '#38bdf8' : '#2563eb');

        // Faint link line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = isDark ? 'rgba(71,85,105,0.2)' : 'rgba(148,163,184,0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        if (p.tier === 'golden') {
          ctx.beginPath();
          ctx.arc(sx, sy, dotR + 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251,191,36,0.4)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Expanded: show people list around the hub
      if (isExpanded) {
        const showCount = Math.min(node.people.length, 30);
        const rings = Math.ceil(showCount / 12);
        let idx = 0;
        for (let ring = 0; ring < rings && idx < showCount; ring++) {
          const ringR = r + 28 + ring * 28;
          const perRing = Math.min(showCount - idx, 12);
          for (let j = 0; j < perRing && idx < showCount; j++, idx++) {
            const p = node.people[idx];
            const angle = (j / perRing) * Math.PI * 2 - Math.PI / 2;
            const sx = cx + Math.cos(angle) * ringR;
            const sy = cy + Math.sin(angle) * ringR;
            const dotR = 5;
            const fill = p.tier === 'golden' ? '#fbbf24' : p.isAmbassador ? '#c084fc' : (isDark ? '#38bdf8' : '#2563eb');
            const isPersonHovered = hoveredPerson === p.id;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = isDark ? 'rgba(71,85,105,0.25)' : 'rgba(148,163,184,0.2)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();

            if (isPersonHovered) {
              ctx.beginPath();
              ctx.arc(sx, sy, dotR + 3, 0, Math.PI * 2);
              ctx.strokeStyle = fill;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            // Name label
            ctx.font = `${isPersonHovered ? 600 : 400} 9px "JetBrains Mono", monospace`;
            ctx.fillStyle = isDark ? (isPersonHovered ? '#e2e8f0' : '#94a3b8') : (isPersonHovered ? '#1e293b' : '#64748b');
            ctx.textAlign = 'center';
            ctx.fillText(p.name.split(' ')[0], sx, sy + dotR + 11);
          }
        }
      }

      // Hub label
      const fontSize = Math.max(10, Math.min(14, r * 0.32));
      ctx.font = `700 ${fontSize}px "DM Sans", sans-serif`;
      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lbl = node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label;
      if (mode === 'country' && node.flag) {
        ctx.font = `${Math.max(14, r * 0.4)}px sans-serif`;
        ctx.fillText(node.flag, cx, cy - fontSize * 0.9);
        ctx.font = `700 ${fontSize}px "DM Sans", sans-serif`;
        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.fillText(lbl, cx, cy + fontSize * 0.3);
      } else {
        ctx.fillText(lbl, cx, cy - 5);
      }

      // Count label
      ctx.font = `600 ${Math.max(9, fontSize - 2)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = hasGold ? '#fbbf24' : (isDark ? '#38bdf8' : '#2563eb');
      const countText = `${node.count}${node.golden ? ` · ${node.golden}★` : ''}`;
      ctx.fillText(countText, cx, cy + (mode === 'country' ? fontSize * 1.5 : fontSize * 0.7));

      ctx.textBaseline = 'alphabetic';
    }

    ctx.restore();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [expandedHub, hoveredHub, hoveredPerson, mode]);

  // Resize handler
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = host.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // Start draw loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Hit testing helper
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { wx: 0, wy: 0 };
    const rect = canvas.getBoundingClientRect();
    const { x: tx, y: ty, k } = transformRef.current;
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return { wx: (sx - tx) / k, wy: (sy - ty) / k };
  }, []);

  const hitTest = useCallback((clientX: number, clientY: number) => {
    const { wx, wy } = screenToWorld(clientX, clientY);
    const nodes = nodesRef.current;

    // Check expanded hub people first
    if (expandedHub) {
      const hub = nodes.find(n => n.id === expandedHub);
      if (hub) {
        const cx = hub.x || 0, cy = hub.y || 0;
        const showCount = Math.min(hub.people.length, 30);
        const rings = Math.ceil(showCount / 12);
        let idx = 0;
        for (let ring = 0; ring < rings && idx < showCount; ring++) {
          const ringR = hub.radius + 28 + ring * 28;
          const perRing = Math.min(showCount - idx, 12);
          for (let j = 0; j < perRing && idx < showCount; j++, idx++) {
            const p = hub.people[idx];
            const angle = (j / perRing) * Math.PI * 2 - Math.PI / 2;
            const sx = cx + Math.cos(angle) * ringR;
            const sy = cy + Math.sin(angle) * ringR;
            const dx = wx - sx, dy = wy - sy;
            if (dx * dx + dy * dy < 100) {
              return { type: 'person' as const, person: p, hub };
            }
          }
        }
      }
    }

    // Check hubs
    for (const node of nodes) {
      const dx = wx - (node.x || 0);
      const dy = wy - (node.y || 0);
      if (dx * dx + dy * dy < node.radius * node.radius) {
        return { type: 'hub' as const, hub: node };
      }
    }
    return null;
  }, [expandedHub, screenToWorld]);

  // Mouse events
  const handleClick = useCallback((e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit?.type === 'person') {
      openProfile(hit.person.id);
    } else if (hit?.type === 'hub') {
      setExpandedHub(prev => prev === hit.hub.id ? null : hit.hub.id);
    } else {
      setExpandedHub(null);
    }
  }, [hitTest, openProfile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.active) {
      transformRef.current.x = dragRef.current.origX + (e.clientX - dragRef.current.startX);
      transformRef.current.y = dragRef.current.origY + (e.clientY - dragRef.current.startY);
      return;
    }
    const hit = hitTest(e.clientX, e.clientY);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = hit ? 'pointer' : 'grab';
    setHoveredHub(hit?.type === 'hub' ? hit.hub.id : (hit?.type === 'person' ? hit.hub.id : null));
    setHoveredPerson(hit?.type === 'person' ? hit.person.id : null);
  }, [hitTest]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) {
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: transformRef.current.x, origY: transformRef.current.y };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    }
  }, [hitTest]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const t = transformRef.current;
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    const newK = Math.max(0.3, Math.min(4, t.k * delta));
    t.x = mx - (mx - t.x) * (newK / t.k);
    t.y = my - (my - t.y) * (newK / t.k);
    t.k = newK;
  }, []);

  // Tooltip content
  const tooltipHub = useMemo(() => {
    if (!hoveredHub) return null;
    return nodesRef.current.find(n => n.id === hoveredHub) || null;
  }, [hoveredHub]);

  return (
    <div style={{
      position: 'fixed', top: 56, left: 340, right: 0, bottom: 28,
      background: 'var(--bg)', zIndex: 2,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 22px 10px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        background: 'var(--panel)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--text)' }}>The Constellation</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {hubs.length} {mode === 'company' ? 'organizations' : 'countries'} · {hubs.reduce((s, h) => s + h.count, 0)} people
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['company', 'country'] as GraphMode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setExpandedHub(null); }} style={{
              background: mode === m ? 'var(--surface-2)' : 'var(--surface)',
              color: mode === m ? 'var(--text)' : 'var(--text-dim)',
              border: `1px solid ${mode === m ? 'var(--border-strong)' : 'var(--border)'}`,
              borderRadius: 6, padding: '6px 10px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer',
            }}>
              by {m}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div ref={hostRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ display: 'block', cursor: 'grab' }}
        />

        {/* Tooltip */}
        {tooltipHub && !expandedHub && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            background: 'var(--panel)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '12px 16px', pointerEvents: 'none',
            fontFamily: "'JetBrains Mono', monospace", maxWidth: 280,
          }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
              {tooltipHub.flag && <span style={{ marginRight: 6 }}>{tooltipHub.flag}</span>}
              {tooltipHub.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {tooltipHub.count} Kubestronaut{tooltipHub.count !== 1 ? 's' : ''}
              {tooltipHub.golden > 0 && <span style={{ color: '#fbbf24' }}> · {tooltipHub.golden} Golden</span>}
              {tooltipHub.ambassador > 0 && <span style={{ color: '#c084fc' }}> · {tooltipHub.ambassador} Ambassador{tooltipHub.ambassador !== 1 ? 's' : ''}</span>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>Click to expand</div>
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', top: 12, right: 16,
          background: 'var(--panel)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: 8,
          padding: '8px 12px', display: 'flex', gap: 12,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8' }} />Kubestronaut
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24' }} />Golden
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c084fc' }} />Ambassador
          </span>
          <span style={{ color: 'var(--text-faint)' }}>scroll to zoom · drag to pan</span>
        </div>
      </div>
    </div>
  );
}
