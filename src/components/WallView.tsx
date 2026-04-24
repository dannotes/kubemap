import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../store/store';
import { avColor, initials, imageUrl } from '../lib/utils';
import { useIsMobile } from '../lib/useIsMobile';
import type { PersonCore } from '../lib/types';

type WallSort = 'country' | 'company' | 'tier' | 'name';

export function WallView() {
  const people = useStore(s => s.people);
  const openProfile = useStore(s => s.openProfile);
  const [sort, setSort] = useState<WallSort>('country');
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    if (sort === 'name') {
      const sorted = people.slice().sort((a, b) => a.name.localeCompare(b.name));
      return [{ key: 'all', label: '', count: sorted.length, golden: 0, flag: '', items: sorted }];
    }

    const keyFn = sort === 'country'
      ? (p: PersonCore) => p.country || 'Unknown'
      : sort === 'company'
      ? (p: PersonCore) => p.company || '—'
      : (p: PersonCore) => p.tier === 'golden' ? '★ Golden Kubestronauts' : p.isAmbassador ? 'CNCF Ambassadors' : 'Kubestronauts';

    const map = new Map<string, PersonCore[]>();
    for (const p of people) {
      const k = keyFn(p);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }

    const tierOrder: Record<string, number> = { '★ Golden Kubestronauts': 0, 'Kubestronauts': 1, 'CNCF Ambassadors': 2 };

    return [...map.entries()]
      .sort((a, b) => sort === 'tier'
        ? (tierOrder[a[0]] ?? 99) - (tierOrder[b[0]] ?? 99)
        : b[1].length - a[1].length)
      .map(([key, items]) => {
        const golden = items.filter(p => p.tier === 'golden').length;
        items.sort((a, b) => (b.tier === 'golden' ? 1 : 0) - (a.tier === 'golden' ? 1 : 0) || a.name.localeCompare(b.name));
        return {
          key,
          label: key,
          count: items.length,
          golden,
          flag: sort === 'country' ? (items[0]?.flag || '🌐') : '',
          items,
        };
      });
  }, [people, sort]);

  // On mobile, auto-collapse all except first group when sort changes
  useEffect(() => {
    if (!isMobile || sort === 'name') {
      setCollapsed(new Set());
      return;
    }
    const allKeys = groups.map(g => g.key);
    // Keep first group expanded, collapse rest
    setCollapsed(new Set(allKeys.slice(1)));
  }, [sort, isMobile, groups.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = useCallback((key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // Calculate columns based on container width
  const parentRef = useRef<HTMLDivElement>(null);
  const [colCount, setColCount] = useState(25);
  const padX = isMobile ? 8 : 22;

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth - padX * 2;
      const cols = Math.floor((w + 4) / (44 + 4));
      setColCount(Math.max(1, cols));
    };
    calc();
    const obs = new ResizeObserver(calc);
    obs.observe(el);
    return () => obs.disconnect();
  }, [padX]);

  // Flatten into exact visual rows, respecting collapsed state on mobile
  const rows = useMemo(() => {
    const result: Array<{ type: 'header'; group: typeof groups[0] } | { type: 'cells'; items: PersonCore[] }> = [];
    for (const g of groups) {
      if (sort !== 'name') {
        result.push({ type: 'header', group: g });
      }
      const isCollapsed = isMobile && collapsed.has(g.key);
      if (!isCollapsed) {
        for (let i = 0; i < g.items.length; i += colCount) {
          result.push({ type: 'cells', items: g.items.slice(i, i + colCount) });
        }
      }
    }
    return result;
  }, [groups, sort, colCount, collapsed, isMobile]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => rows[i].type === 'header' ? 44 : 48,
    overscan: 2,
  });

  // Spotlight: responsive count based on container width
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [spotlightCount, setSpotlightCount] = useState(isMobile ? 6 : 14);
  useEffect(() => {
    const el = spotlightRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth;
      const itemW = isMobile ? 62 : 82; // item width + gap
      setSpotlightCount(Math.max(4, Math.floor(w / itemW)));
    };
    calc();
    const obs = new ResizeObserver(calc);
    obs.observe(el);
    return () => obs.disconnect();
  }, [isMobile]);

  // Spotlight: mix of golden, ambassador, and regular kubestronauts with photos
  const spotlight = useMemo(() => {
    const withPhotos = people.filter(p => p.image);
    const golden = withPhotos.filter(p => p.tier === 'golden').sort(() => Math.random() - 0.5);
    const ambassadors = withPhotos.filter(p => p.isAmbassador && p.tier !== 'golden').sort(() => Math.random() - 0.5);
    const regular = withPhotos.filter(p => p.tier === 'regular' && !p.isAmbassador).sort(() => Math.random() - 0.5);
    // Mix: ~40% golden, ~20% ambassador, ~40% regular
    const gCount = Math.ceil(spotlightCount * 0.4);
    const aCount = Math.ceil(spotlightCount * 0.2);
    const rCount = spotlightCount - gCount - aCount;
    const mixed = [
      ...golden.slice(0, gCount),
      ...ambassadors.slice(0, aCount),
      ...regular.slice(0, rCount),
    ].sort(() => Math.random() - 0.5);
    return mixed;
  }, [people, spotlightCount]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'var(--bg)', zIndex: 2,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '10px 12px 8px' : '14px 22px 10px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 8 : 16,
        background: 'var(--panel)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: isMobile ? 15 : 17, letterSpacing: '-0.02em', color: 'var(--text)' }}>Wall</h2>
          <span style={{ fontSize: isMobile ? 10 : 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {people.length.toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 4 : 6 }}>
          {(['country', 'company', 'tier', 'name'] as WallSort[]).map(s => (
            <button key={s} onClick={() => setSort(s)} style={{
              background: sort === s ? 'var(--surface-2)' : 'var(--surface)',
              color: sort === s ? 'var(--text)' : 'var(--text-dim)',
              border: `1px solid ${sort === s ? 'var(--border-strong)' : 'var(--border)'}`,
              borderRadius: 6, padding: isMobile ? '5px 8px' : '6px 10px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 10 : 11, cursor: 'pointer',
            }}>
              {s === 'country' ? (isMobile ? 'country' : 'by country') : s === 'company' ? (isMobile ? 'company' : 'by company') : s === 'tier' ? (isMobile ? 'tier' : 'by tier') : 'A–Z'}
            </button>
          ))}
        </div>
      </div>

      {/* Spotlight — featured kubestronauts */}
      {spotlight.length > 0 && (
        <div ref={spotlightRef} style={{
          padding: isMobile ? '10px 8px 6px' : '14px 22px 10px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(180deg, rgba(56,189,248,0.03) 0%, transparent 100%)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--accent)',
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600,
          }}>
            Spotlight
          </div>
          <div style={{
            display: 'flex', gap: isMobile ? 8 : 14, overflowX: 'auto',
            paddingBottom: 4, scrollbarWidth: 'none',
          }}>
            {spotlight.map(p => {
              const ringColor = p.tier === 'golden' ? 'var(--gold-soft)' : p.isAmbassador ? '#c084fc' : 'var(--accent)';
              const glowColor = p.tier === 'golden' ? 'rgba(251,191,36,0.25)' : p.isAmbassador ? 'rgba(192,132,252,0.25)' : 'rgba(56,189,248,0.2)';
              return (
              <div key={p.id} onClick={() => openProfile(p.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                cursor: 'pointer', flexShrink: 0, width: isMobile ? 54 : 68,
              }}>
                <div style={{
                  width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: '50%',
                  overflow: 'hidden', position: 'relative',
                  border: `2px solid ${ringColor}`,
                  boxShadow: `0 0 14px ${glowColor}`,
                }}>
                  <img src={imageUrl(p.image)!} alt="" loading="eager" fetchPriority="high" style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                  }} onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 8.5 : 9.5, fontWeight: 600,
                  color: 'var(--text)', textAlign: 'center', maxWidth: '100%',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.name.split(' ')[0]}
                </span>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Virtual scroll body */}
      <div ref={parentRef} style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map(vItem => {
            const row = rows[vItem.index];
            if (row.type === 'header') {
              const isGroupCollapsed = collapsed.has(row.group.key);
              return (
                <div key={vItem.key} style={{
                  position: 'absolute', top: 0, left: 0, width: '100%',
                  transform: `translateY(${vItem.start}px)`,
                  padding: isMobile ? '10px 8px 4px' : '14px 22px 6px',
                }} ref={virtualizer.measureElement} data-index={vItem.index}>
                  <div
                    onClick={isMobile && sort !== 'name' ? () => toggleGroup(row.group.key) : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 0 8px', borderBottom: '1px dashed var(--border)',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-dim)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      cursor: isMobile && sort !== 'name' ? 'pointer' : 'default',
                    }}
                  >
                    {row.group.flag && <span style={{ fontSize: 14 }}>{row.group.flag}</span>}
                    <b style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12, textTransform: 'none', letterSpacing: '-0.01em', fontFamily: "'DM Sans', sans-serif" }}>
                      {row.group.label}
                    </b>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{row.group.count}</span>
                    {row.group.golden > 0 && <span style={{ color: 'var(--gold-soft)' }}>· {row.group.golden}★</span>}
                    {isMobile && sort !== 'name' && (
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2.5} strokeLinecap="round"
                        style={{ marginLeft: 'auto', transform: isGroupCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform .2s', flexShrink: 0 }}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={vItem.key} style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                transform: `translateY(${vItem.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                gap: 4, padding: `0 ${padX}px`,
              }} ref={virtualizer.measureElement} data-index={vItem.index}>
                {row.items.map(p => (
                  <WallCell key={p.id} person={p} onClick={() => openProfile(p.id)} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WallCell({ person: p, onClick }: { person: PersonCore; onClick: () => void }) {
  const imgSrc = imageUrl(p.image);
  const [loaded, setLoaded] = useState(false);

  return (
    <div onClick={onClick} title={`${p.name} · ${p.country}${p.company ? ' · ' + p.company : ''}`}
      style={{
        aspectRatio: '1', borderRadius: 6, cursor: 'pointer',
        background: 'var(--surface-2)', position: 'relative', overflow: 'hidden',
        border: `1px solid ${p.tier === 'golden' ? 'rgba(251,191,36,0.6)' : 'var(--border)'}`,
        transition: 'transform .12s, box-shadow .12s',
        zIndex: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.25)';
        e.currentTarget.style.zIndex = '10';
        e.currentTarget.style.boxShadow = p.tier === 'golden'
          ? '0 6px 20px rgba(251,191,36,0.6), 0 0 0 2px var(--gold-soft)'
          : '0 6px 20px rgba(0,0,0,0.5), 0 0 0 2px var(--accent)';
        if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.zIndex = '5';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.zIndex = '0';
        e.currentTarget.style.boxShadow = '';
        if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.zIndex = '';
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 11, color: 'var(--text-faint)',
        background: avColor(p.name),
        letterSpacing: '0.04em',
      }}>
        {initials(p.name)}
      </div>
      {imgSrc && (
        <img src={imgSrc} alt="" loading="lazy"
          decoding="async"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'scale(1)' : 'scale(1.04)',
            transition: 'opacity .4s ease, transform .4s ease',
          }}
          onLoad={() => setLoaded(true)}
          onError={e => (e.currentTarget.style.display = 'none')}
        />
      )}
      {p.tier === 'golden' && <span style={{ position: 'absolute', right: 2, top: 2, fontSize: 8, lineHeight: 1, color: '#fbbf24', zIndex: 2 }}>★</span>}
      {p.isAmbassador && p.tier !== 'golden' && <span style={{ position: 'absolute', right: 2, top: 2, fontSize: 8, lineHeight: 1, color: '#c084fc', zIndex: 2 }}>A</span>}
    </div>
  );
}
