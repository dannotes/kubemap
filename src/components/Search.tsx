import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store/store';
import { avColor, initials, imageUrl } from '../lib/utils';

// Pre-computed search index for speed
interface SearchEntry {
  id: string;
  searchStr: string; // pre-lowercased concat of name+country+company+location
  person: any;
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function Search() {
  const people = useStore(s => s.people);
  const openProfile = useStore(s => s.openProfile);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 120);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ddRef = useRef<HTMLDivElement>(null);

  // Build search index once when people changes
  const searchIndex = useMemo<SearchEntry[]>(() => {
    return people.map(p => ({
      id: p.id,
      searchStr: `${p.name}\t${p.country}\t${p.company}\t${p.location}`.toLowerCase(),
      person: p,
    }));
  }, [people]);

  const hits = useMemo(() => {
    if (debouncedQuery.length < 1) return [];
    const q = debouncedQuery.toLowerCase();
    const results: any[] = [];
    for (const entry of searchIndex) {
      if (entry.searchStr.includes(q)) {
        results.push(entry.person);
        if (results.length >= 10) break;
      }
    }
    return results;
  }, [debouncedQuery, searchIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleSelect = useCallback((id: string) => {
    const person = people.find(p => p.id === id);
    openProfile(id);
    if (person) {
      (useStore.getState() as any).flyTo(person.lat, person.lon, 5);
    }
    setQuery('');
    setOpen(false);
  }, [openProfile, people]);

  return (
    <div style={{ flex: 1, maxWidth: 540, position: 'relative' }}>
      <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search Kubestronauts, countries, companies…"
        autoComplete="off"
        style={{
          width: '100%', height: 34,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0 38px 0 34px',
          color: 'var(--text)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5,
          outline: 'none',
        }}
      />
      <span style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        fontSize: 10, color: 'var(--text-faint)', background: 'var(--surface-2)',
        padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)',
      }}>⌘K</span>

      {open && hits.length > 0 && (
        <div ref={ddRef} style={{
          position: 'absolute', left: 0, right: 0, top: 40,
          background: 'var(--panel-solid)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          maxHeight: 360, overflowY: 'auto', padding: 6, zIndex: 600,
        }}>
          {hits.map(p => (
            <div
              key={p.id}
              onClick={() => handleSelect(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 8, borderRadius: 6, cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: avColor(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: '#0b1220',
                flexShrink: 0, overflow: 'hidden', position: 'relative',
              }}>
                {p.image && (
                  <img src={imageUrl(p.image)!} alt="" loading="lazy"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <span>{initials(p.name)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                  {p.name}{p.tier === 'golden' ? <span style={{ color: 'var(--gold)' }}> ★</span> : ''}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                  {p.flag} {p.country}{p.company ? ` · ${p.company}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {open && query && hits.length === 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 40,
          background: 'var(--panel-solid)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: 18, textAlign: 'center',
          color: 'var(--text-muted)', fontSize: 11.5, zIndex: 600,
        }}>
          No matches
        </div>
      )}
    </div>
  );
}
