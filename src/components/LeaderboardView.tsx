import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { avColor, initials, imageUrl } from '../lib/utils';
import { useIsMobile } from '../lib/useIsMobile';

export function LeaderboardView() {
  const people = useStore(s => s.people);
  const openProfile = useStore(s => s.openProfile);
  const isMobile = useIsMobile();

  const data = useMemo(() => {
    const countries: Record<string, { count: number; golden: number; flag: string }> = {};
    const companies: Record<string, { count: number; golden: number }> = {};
    const cities: Record<string, { count: number; golden: number; flag: string }> = {};

    for (const p of people) {
      if (p.country !== 'Unknown') {
        if (!countries[p.country]) countries[p.country] = { count: 0, golden: 0, flag: p.flag };
        countries[p.country].count++;
        if (p.tier === 'golden') countries[p.country].golden++;
      }
      if (p.company) {
        if (!companies[p.company]) companies[p.company] = { count: 0, golden: 0 };
        companies[p.company].count++;
        if (p.tier === 'golden') companies[p.company].golden++;
      }
      if (p.location) {
        const city = p.location.split(',')[0].trim();
        if (city) {
          if (!cities[city]) cities[city] = { count: 0, golden: 0, flag: p.flag };
          cities[city].count++;
          if (p.tier === 'golden') cities[city].golden++;
        }
      }
    }

    const topCountries = Object.entries(countries).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
    const topCompanies = Object.entries(companies).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
    const topCities = Object.entries(cities).sort((a, b) => b[1].count - a[1].count).slice(0, 10);

    const goldDensity = Object.entries(countries)
      .filter(([, v]) => v.count >= 5)
      .map(([name, v]) => ({ name, ...v, pct: Math.round(v.golden / v.count * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);

    const topContributors = people
      .filter(p => p.projects.length > 0)
      .sort((a, b) => b.projects.length - a.projects.length || a.name.localeCompare(b.name))
      .slice(0, 10);

    return { topCountries, topCompanies, topCities, goldDensity, topContributors };
  }, [people]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'var(--bg)', zIndex: 2,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: isMobile ? '10px 12px 8px' : '14px 22px 10px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        background: 'var(--panel)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: isMobile ? 15 : 17, letterSpacing: '-0.02em', color: 'var(--text)' }}>Leaderboard</h2>
          <span style={{ fontSize: isMobile ? 10 : 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>community rankings</span>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? 10 : 16, padding: isMobile ? '12px 8px' : '18px 22px' }}>
          {/* Top countries */}
          <LbCard title="Top countries" meta={`${data.topCountries.length} on the map`} defaultOpen isMobile={isMobile}>
            {data.topCountries.map(([name, v], i) => (
              <LbRow key={name} rank={i + 1}
                icon={<div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', fontSize: 14 }}>{v.flag}</div>}
                name={name} sub={`${v.golden ? v.golden + ' Golden · ' : ''}${v.count} total`}
                val={v.count} bar={v.count / data.topCountries[0][1].count}
              />
            ))}
          </LbCard>

          {/* Top companies */}
          <LbCard title="Top companies" meta="by Kubestronaut headcount" isMobile={isMobile}>
            {data.topCompanies.map(([name, v], i) => (
              <LbRow key={name} rank={i + 1}
                icon={<div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: avColor(name), fontSize: 10.5, fontWeight: 700, color: '#0b1220', fontFamily: "'DM Sans', sans-serif" }}>{initials(name)}</div>}
                name={name} sub={`${v.golden ? v.golden + ' Golden' : v.count + ' people'}`}
                val={v.count} bar={v.count / data.topCompanies[0][1].count}
              />
            ))}
          </LbCard>

          {/* Top cities */}
          <LbCard title="Top cities" meta="hottest hubs" isMobile={isMobile}>
            {data.topCities.map(([name, v], i) => (
              <LbRow key={name} rank={i + 1}
                icon={<div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', fontSize: 14 }}>📍</div>}
                name={name} sub={`${v.golden ? v.golden + ' Golden · ' : ''}${v.count}`}
                val={v.count} bar={v.count / data.topCities[0][1].count}
              />
            ))}
          </LbCard>

          {/* Golden density */}
          <LbCard title="Golden density" meta="% per country" isMobile={isMobile}>
            {data.goldDensity.map((d, i) => (
              <LbRow key={d.name} rank={i + 1} gold
                icon={<div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', fontSize: 14 }}>{d.flag}</div>}
                name={d.name} sub={`${d.golden} of ${d.count}`}
                val={d.pct} unit="%" bar={d.pct / 100}
              />
            ))}
          </LbCard>

          {/* Top CNCF project contributors */}
          <LbCard title="Top contributors" meta="most projects" isMobile={isMobile}>
            {data.topContributors.map((p, i) => (
              <div key={p.id} onClick={() => openProfile(p.id)} style={{
                display: 'grid', gridTemplateColumns: '28px 32px 1fr auto',
                alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: i < 3 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: i < 3 ? 800 : 600, textAlign: 'right' }}>{i + 1}</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', background: avColor(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#0b1220', position: 'relative' }}>
                  {p.image && <img src={imageUrl(p.image)!} loading="lazy" onError={e => (e.currentTarget.style.display = 'none')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <span>{initials(p.name)}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                    {p.tier === 'golden' && <span style={{ color: 'var(--gold-soft)', marginLeft: 4 }}>★</span>}
                    {p.isAmbassador && <span style={{ fontSize: 8.5, fontWeight: 700, background: 'rgba(168,85,247,0.2)', color: '#c084fc', borderRadius: 3, padding: '1px 4px', marginLeft: 4, verticalAlign: 'middle' }}>A</span>}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)' }}>{p.flag} {p.country}{p.company ? ` · ${p.company}` : ''}</div>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>
                  {p.projects.length}<span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 10, marginLeft: 2 }}>projects</span>
                </div>
              </div>
            ))}
          </LbCard>

        </div>
      </div>
    </div>
  );
}

function LbCard({ title, meta, children, defaultOpen = false, isMobile = false }: {
  title: string; meta: string; children: React.ReactNode; defaultOpen?: boolean; isMobile?: boolean;
}) {
  const [open, setOpen] = useState(isMobile ? defaultOpen : true);

  return (
    <div style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={isMobile ? () => setOpen(!open) : undefined}
        style={{
          padding: '14px 16px', borderBottom: open ? '1px solid var(--border)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: isMobile ? 'pointer' : 'default',
        }}
      >
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{meta}</span>
          {isMobile && (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2.5} strokeLinecap="round"
              style={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s', flexShrink: 0 }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </div>
      </div>
      {open && <div style={{ padding: '8px 4px' }}>{children}</div>}
    </div>
  );
}

function LbRow({ rank, icon, name, sub, val, unit = '', bar: _bar = 0, gold: _gold = false }: {
  rank: number; icon: React.ReactNode; name: string; sub: string;
  val: number; unit?: string; bar: number; gold?: boolean;
}) {
  const topCls = rank <= 3;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '28px 32px 1fr auto', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 8, cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        color: rank === 1 ? 'var(--gold-soft)' : topCls ? 'var(--accent)' : 'var(--text-muted)',
        fontWeight: topCls ? 800 : 600, textAlign: 'right',
      }}>{rank}</div>
      {icon}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
        {val.toLocaleString()}<span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 10, marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}
