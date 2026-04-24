import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { avColor, initials, imageUrl } from '../lib/utils';
import { generateProfileCard, downloadBlob } from '../lib/profileCard';


function socialHref(key: string, value: string): string {
  if (/^https?:/.test(value)) return value;
  switch (key) {
    case 'github': return `https://github.com/${value.replace(/^@/, '')}`;
    case 'twitter': return `https://x.com/${value.replace(/^@/, '')}`;
    case 'linkedin': return `https://linkedin.com/in/${value}`;
    case 'bluesky': return `https://bsky.app/profile/${value}`;
    default: return value;
  }
}

export function ProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const people = useStore(s => s.people);
  const loading = useStore(s => s.loading);

  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const details = useStore(s => s.details);
  const person = useMemo(() => people.find(p => p.id === slug), [people, slug]);
  const detail = slug && details ? details[slug] : null;

  // Set OG meta tags
  useEffect(() => {
    if (!person) return;
    document.title = `${person.name} — kubemap`;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const tierLabel = person.tier === 'golden' ? '★ Golden Kubestronaut' : person.tier === 'regular' ? 'Kubestronaut' : 'CNCF Ambassador';
    const desc = `${tierLabel} from ${person.country}${person.company ? ` at ${person.company}` : ''}`;

    setMeta('og:title', `${person.name} — ${tierLabel}`);
    setMeta('og:description', desc);
    setMeta('og:url', `https://kubemap.app/k/${person.id}`);
    setMeta('og:type', 'profile');
    if (person.image) {
      setMeta('og:image', imageUrl(person.image)!);
    }
    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', `${person.name} — ${tierLabel}`);
    setMeta('twitter:description', desc);

    return () => { document.title = 'kubemap — live map of Kubestronauts'; };
  }, [person]);

  if (loading) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', fontSize: 12,
      }}>
        Loading<span className="dots" />
      </div>
    );
  }

  if (!person) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', fontSize: 13, gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🔭</div>
        <div>Kubestronaut not found</div>
        <Link to="/" style={{
          color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 8,
        }}>
          ← Back to map
        </Link>
      </div>
    );
  }

  const p = person;
  const isGold = p.tier === 'golden';
  const tierLabel = isGold ? '★ Golden Kubestronaut' : p.tier === 'regular' ? 'Kubestronaut' : 'CNCF Ambassador';
  const img = imageUrl(p.image);
  const showCerts = p.tier === 'golden' || p.tier === 'regular';
  const socials = detail ? Object.entries(detail.socials).filter(([, v]) => v) : [];

  // Find rank in country
  const countryPeers = people.filter(pp => pp.country === p.country);
  const countryRank = countryPeers.sort((a, b) => a.name.localeCompare(b.name)).findIndex(pp => pp.id === p.id) + 1;

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'var(--bg)',
    }}>
      {/* Top nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--panel)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.4))',
          }}>
            <svg viewBox="0 0 32 32" width={26} height={26}>
              <defs><linearGradient id="logo-p" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#326ce5"/><stop offset="50%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
              <path d="M16 1C9.4 1 4 6.1 4 12.3c0 8.5 10.3 17.5 11.2 18.3a1.2 1.2 0 0 0 1.6 0C17.7 29.8 28 20.8 28 12.3 28 6.1 22.6 1 16 1z" fill="url(#logo-p)"/>
              <circle cx="16" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.5"/>
              <line x1="16" y1="5.5" x2="16" y2="8.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="16" y1="15.5" x2="16" y2="18.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="10.4" y1="8.8" x2="12.9" y2="10.3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="19.1" y1="13.7" x2="21.6" y2="15.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="21.6" y1="8.8" x2="19.1" y2="10.3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12.9" y1="13.7" x2="10.4" y2="15.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="16" cy="5.5" r="1.2" fill="#fff"/><circle cx="16" cy="18.5" r="1.2" fill="#fff"/>
              <circle cx="10.4" cy="8.8" r="1.2" fill="#fff"/><circle cx="21.6" cy="15.2" r="1.2" fill="#fff"/>
              <circle cx="21.6" cy="8.8" r="1.2" fill="#fff"/><circle cx="10.4" cy="15.2" r="1.2" fill="#fff"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            kubemap<span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>.app</span>
          </span>
        </Link>
        <span style={{ color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>/ k / {p.id}</span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            position: 'relative', width: 180, height: 180, borderRadius: '50%',
            background: avColor(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 50, color: '#0b1220',
            boxShadow: isGold
              ? '0 0 0 4px var(--panel-solid), 0 0 0 6px rgba(245,158,11,0.8), 0 0 60px rgba(245,158,11,0.4)'
              : p.isAmbassador
                ? '0 0 0 4px var(--panel-solid), 0 0 0 6px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4)'
                : '0 0 0 4px var(--panel-solid), 0 0 0 6px color-mix(in srgb, var(--accent) 45%, transparent)',
            marginBottom: 20, overflow: 'hidden',
          }}>
            {img && <img key={p.id} src={img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', zIndex: 1 }} onError={e => (e.currentTarget.style.display = 'none')} />}
            <span>{initials(p.name)}</span>
          </div>

          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 28, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {p.name}
            {detail?.pronouns && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-faint)', fontWeight: 400, marginLeft: 8 }}>{detail.pronouns}</span>}
          </h1>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '6px 14px', borderRadius: 6,
            background: isGold ? 'rgba(245,158,11,0.1)' : p.isAmbassador ? 'rgba(168,85,247,0.12)' : 'rgba(56,189,248,0.1)',
            color: isGold ? 'var(--gold-soft)' : p.isAmbassador ? '#c084fc' : 'var(--accent)',
            border: `1px solid ${isGold ? 'rgba(245,158,11,0.35)' : p.isAmbassador ? 'rgba(168,85,247,0.4)' : 'color-mix(in srgb, var(--accent) 30%, transparent)'}`,
          }}>{tierLabel}</span>

          <div style={{ marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-dim)' }}>
            {p.company && <span>{p.company}</span>}
          </div>
          <div style={{ marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>
            {p.flag} {p.location || p.country}
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
            <span><span style={{ color: 'var(--text-faint)' }}>Country rank </span><span style={{ color: 'var(--accent)' }}>#{countryRank}</span> of {countryPeers.length}</span>
          </div>
        </div>

        {/* Bio */}
        {detail?.bio && (
          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Bio</h3>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8,
              borderLeft: `2px solid ${isGold ? 'rgba(245,158,11,0.4)' : 'color-mix(in srgb, var(--accent) 30%, transparent)'}`,
              padding: '4px 0 4px 16px', margin: 0,
            }}>{detail.bio}</p>
          </section>
        )}

        {/* Certs summary */}
        {showCerts && (
          <section style={{ marginBottom: 32 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              background: isGold ? 'rgba(245,158,11,0.08)' : 'color-mix(in srgb, var(--accent) 8%, transparent)',
              border: `1px solid ${isGold ? 'rgba(245,158,11,0.25)' : 'color-mix(in srgb, var(--accent) 25%, transparent)'}`,
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 18 }}>{isGold ? '★' : '✓'}</span>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: isGold ? 'var(--gold-soft)' : 'var(--accent)' }}>
                  {isGold ? 'Golden Kubestronaut' : 'Kubestronaut'}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  All required CNCF certifications
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Projects & Languages */}
        {(p.projects.length > 0 || (detail && detail.languages.length > 0)) && (
          <section style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {p.projects.length > 0 && (
              <div>
                <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Projects</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.projects.map(t => (
                    <span key={t} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-dim)',
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, padding: '4px 10px',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
            {detail && detail.languages.length > 0 && (
              <div>
                <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Languages</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detail.languages.map(t => (
                    <span key={t} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-dim)',
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, padding: '4px 10px',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Socials */}
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Social</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {socials.length > 0 ? socials.map(([key, val]) => (
              <a key={key} href={socialHref(key, val!)} target="_blank" rel="noopener"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  textDecoration: 'none',
                }}
              >
                {key}
              </a>
            )) : (
              <span style={{ color: 'var(--text-faint)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>no links shared</span>
            )}
          </div>
        </section>

        {/* Share */}
        <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => {
              navigator.clipboard?.writeText(`https://kubemap.app/k/${p.id}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }} style={{
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
              color: 'color-mix(in srgb, var(--accent) 70%, white)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, borderRadius: 8,
              padding: '10px 24px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {copied
                  ? <path d="M20 6 9 17l-5-5" />
                  : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
                }
              </svg>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button onClick={async () => {
              setGenerating(true);
              try {
                const blob = await generateProfileCard(p);
                downloadBlob(blob, `kubemap-${p.id}.png`);
              } finally {
                setGenerating(false);
              }
            }} disabled={generating} style={{
              background: isGold ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.08)',
              border: `1px solid ${isGold ? 'rgba(251,191,36,0.35)' : 'rgba(56,189,248,0.25)'}`,
              color: isGold ? '#fbbf24' : '#38bdf8',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, borderRadius: 8,
              padding: '10px 24px', cursor: generating ? 'wait' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              opacity: generating ? 0.6 : 1,
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {generating ? 'Generating...' : 'Download card'}
            </button>
          </div>
          <div style={{ marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)' }}>
            Share your profile card on LinkedIn, Twitter, or anywhere
          </div>
        </div>

        {/* Footer disclaimer */}
        <div style={{ textAlign: 'center', marginTop: 32, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.6 }}>
          Unofficial. Not affiliated with or endorsed by CNCF or the Linux Foundation.<br />
          Data from <a href="https://github.com/cncf/people" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>cncf/people</a> under the MIT license.
          Kubestronaut™ and CNCF® are trademarks of the Linux Foundation.
        </div>
      </div>
    </div>
  );
}
