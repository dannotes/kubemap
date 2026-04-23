import { useState, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../store/store';
import { avColor, initials, imageUrl } from '../lib/utils';
import type { PersonCore } from '../lib/types';

type WallSort = 'country' | 'company' | 'tier' | 'name';

export function WallView() {
  const people = useStore(s => s.people);
  const openProfile = useStore(s => s.openProfile);
  const [sort, setSort] = useState<WallSort>('country');

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

    // For tier sort, put Golden first, then Kubestronauts, then Ambassadors
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

  // Calculate columns based on container width
  const parentRef = useRef<HTMLDivElement>(null);
  const [colCount, setColCount] = useState(25);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth - 44; // minus horizontal padding
      const cols = Math.floor((w + 4) / (44 + 4)); // cell min 44px + 4px gap
      setColCount(Math.max(1, cols));
    };
    calc();
    const obs = new ResizeObserver(calc);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Flatten into exact visual rows — no partial rows, no gaps
  const rows = useMemo(() => {
    const result: Array<{ type: 'header'; group: typeof groups[0] } | { type: 'cells'; items: PersonCore[] }> = [];
    for (const g of groups) {
      if (sort !== 'name') {
        result.push({ type: 'header', group: g });
      }
      for (let i = 0; i < g.items.length; i += colCount) {
        result.push({ type: 'cells', items: g.items.slice(i, i + colCount) });
      }
    }
    return result;
  }, [groups, sort, colCount]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => rows[i].type === 'header' ? 44 : 48,
    overscan: 5,
  });

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
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--text)' }}>The Wall</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {people.length.toLocaleString()} people
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['country', 'company', 'tier', 'name'] as WallSort[]).map(s => (
            <button key={s} onClick={() => setSort(s)} style={{
              background: sort === s ? 'var(--surface-2)' : 'var(--surface)',
              color: sort === s ? 'var(--text)' : 'var(--text-dim)',
              border: `1px solid ${sort === s ? 'var(--border-strong)' : 'var(--border)'}`,
              borderRadius: 6, padding: '6px 10px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer',
            }}>
              {s === 'country' ? 'by country' : s === 'company' ? 'by company' : s === 'tier' ? 'by tier' : 'A–Z'}
            </button>
          ))}
        </div>
      </div>

      {/* Virtual scroll body */}
      <div ref={parentRef} style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map(vItem => {
            const row = rows[vItem.index];
            if (row.type === 'header') {
              return (
                <div key={vItem.key} style={{
                  position: 'absolute', top: 0, left: 0, width: '100%',
                  transform: `translateY(${vItem.start}px)`,
                  padding: '14px 22px 6px',
                }} ref={virtualizer.measureElement} data-index={vItem.index}>
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: 10,
                    padding: '6px 0 8px', borderBottom: '1px dashed var(--border)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-dim)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {row.group.flag && <span style={{ fontSize: 14 }}>{row.group.flag}</span>}
                    <b style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12, textTransform: 'none', letterSpacing: '-0.01em', fontFamily: "'DM Sans', sans-serif" }}>
                      {row.group.label}
                    </b>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{row.group.count}</span>
                    {row.group.golden > 0 && <span style={{ color: 'var(--gold-soft)' }}>· {row.group.golden}★</span>}
                  </div>
                </div>
              );
            }

            return (
              <div key={vItem.key} style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                transform: `translateY(${vItem.start}px)`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
                gap: 4, padding: '0 22px',
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
        // Elevate parent row so hovered cell isn't clipped by the next row
        if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.zIndex = '5';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.zIndex = '0';
        e.currentTarget.style.boxShadow = '';
        if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.zIndex = '';
      }}
    >
      {/* Initials placeholder — always rendered behind image */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, color: '#fff',
        background: avColor(p.name),
      }}>
        {initials(p.name)}
      </div>
      {imgSrc && (
        <img src={imgSrc} alt="" loading="lazy"
          decoding="async"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.2s ease-in',
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
