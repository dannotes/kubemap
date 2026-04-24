import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/store';
import { avColor, initials, imageUrl } from '../lib/utils';
import { useIsMobile } from '../lib/useIsMobile';
import { generateProfileCard, downloadBlob } from '../lib/profileCard';
import type { PersonCore } from '../lib/types';

const SOCIAL_SVGS: Record<string, string> = {
  github: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55 4.56-1.53 7.84-5.83 7.84-10.9C23.5 5.65 18.35.5 12 .5Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 .02 5 2.5 2.5 0 0 1-.02-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C21.45 8.65 22 11 22 14.1V21h-4v-6.1c0-1.45-.03-3.32-2.02-3.32-2.02 0-2.33 1.58-2.33 3.2V21h-4V9Z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18.9 3H22l-7.5 8.6L23 21h-6.9l-5.4-7.1L4.5 21H1.4l8-9.2L1 3h7.1l4.9 6.5L18.9 3Zm-2.4 16.2h1.9L7.6 4.7H5.5L16.5 19.2Z"/></svg>',
  bluesky: '<svg viewBox="0 0 600 530" width="14" height="14" fill="currentColor"><path d="M135 88c60 46 125 138 150 188 25-50 90-142 150-188 43-33 113-58 113 22 0 16-9 134-14 153-19 69-91 87-155 76 111 19 139 82 78 145-116 120-166-30-179-69-3-8-4-11-4-9 0-2-1 1-4 9-13 39-63 189-179 69-61-63-33-126 78-145-64 11-136-7-155-76-5-19-14-137-14-153 0-80 70-55 113-22Z"/></svg>',
  website: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M23 12s0-3.7-.5-5.5c-.3-1-1.1-1.8-2-2C18.7 4 12 4 12 4s-6.7 0-8.5.5c-1 .2-1.8 1-2 2C1 8.3 1 12 1 12s0 3.7.5 5.5c.3 1 1.1 1.8 2 2C5.3 20 12 20 12 20s6.7 0 8.5-.5c1-.2 1.8-1 2-2 .5-1.8.5-5.5.5-5.5ZM10 15.5v-7l6 3.5-6 3.5Z"/></svg>',
};


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

export function ProfilePanel() {
  const profileId = useStore(s => s.profileId);
  const people = useStore(s => s.people);
  const details = useStore(s => s.details);
  const openProfile = useStore(s => s.openProfile);
  const isMobile = useIsMobile();

  const person = useMemo(() => {
    if (!profileId) return null;
    return people.find(p => p.id === profileId) || null;
  }, [profileId, people]);

  const detail = profileId && details ? details[profileId] : null;

  const [imgLoaded, setImgLoaded] = useState(false);
  useEffect(() => { setImgLoaded(false); }, [profileId]);

  const panelStyle = isMobile
    ? { position: 'fixed' as const, top: 48, left: 0, right: 0, bottom: 56, width: 'auto' as const, borderLeft: 'none' }
    : { position: 'fixed' as const, top: 56, right: 0, bottom: 28, width: 400, borderLeft: '1px solid var(--border)' };

  if (!person) {
    return (
      <aside style={{
        ...panelStyle,
        background: 'var(--panel)', backdropFilter: 'blur(18px)',
        transform: 'translateX(110%)', transition: 'transform .32s cubic-bezier(.4,0,.2,1)',
        zIndex: 420,
      }} />
    );
  }

  const p = person;
  const isGold = p.tier === 'golden';
  const showCerts = p.tier === 'golden' || p.tier === 'regular';
  const img = imageUrl(p.image);

  const socials = detail ? Object.entries(detail.socials).filter(([, v]) => v) : [];

  return (
    <aside style={{
      ...panelStyle,
      background: 'var(--panel)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      transform: isMobile ? 'translateX(0)' : 'translateX(0)',
      transition: 'transform .32s cubic-bezier(.4,0,.2,1)',
      zIndex: 495, display: 'flex', flexDirection: 'column',
      boxShadow: isMobile ? 'none' : '-20px 0 60px rgba(0,0,0,0.5)',
    }}>
      {/* Close */}
      <button onClick={() => openProfile(null)} style={{
        position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 6,
        background: 'var(--panel-solid)', border: '1px solid var(--border)', color: 'var(--text-muted)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer',
      }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Hero */}
      <div style={{
        position: 'relative', padding: '26px 20px 18px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border)',
        background: isGold
          ? 'linear-gradient(180deg, rgba(245,158,11,0.14), transparent 70%)'
          : p.isAmbassador
            ? 'linear-gradient(180deg, rgba(168,85,247,0.14), transparent 70%)'
            : 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%)',
      }}>
        {/* Ring */}
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          width: isMobile ? 130 : 190, height: isMobile ? 130 : 190, borderRadius: '50%',
          background: isGold
            ? 'conic-gradient(from 0deg, transparent, rgba(245,158,11,0.7), transparent 50%, rgba(245,158,11,0.7), transparent)'
            : p.isAmbassador
              ? 'conic-gradient(from 0deg, transparent, rgba(168,85,247,0.7), transparent 50%, rgba(168,85,247,0.7), transparent)'
              : 'conic-gradient(from 0deg, transparent, color-mix(in srgb, var(--accent) 50%, transparent), transparent 50%, color-mix(in srgb, var(--accent) 50%, transparent), transparent)',
          animation: 'ringSpin 18s linear infinite',
          filter: 'blur(10px)', opacity: (isGold || p.isAmbassador) ? 0.95 : 0.55, pointerEvents: 'none',
        }} />

        {/* Avatar */}
        <div
          className={img && !imgLoaded ? 'avatar-loading' : ''}
          style={{
            position: 'relative', width: isMobile ? 110 : 168, height: isMobile ? 110 : 168, borderRadius: '50%',
            background: avColor(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: isMobile ? 32 : 46, color: '#0b1220',
            '--avatar-ring': isGold ? 'rgba(245,158,11,0.6)' : p.isAmbassador ? 'rgba(168,85,247,0.6)' : 'rgba(56,189,248,0.5)',
            boxShadow: isGold
              ? '0 0 0 3px var(--panel-solid), 0 0 0 5px rgba(245,158,11,0.8), 0 0 50px rgba(245,158,11,0.4), 0 18px 40px rgba(0,0,0,0.5)'
              : p.isAmbassador
                ? '0 0 0 3px var(--panel-solid), 0 0 0 5px rgba(168,85,247,0.8), 0 0 50px rgba(168,85,247,0.4), 0 18px 40px rgba(0,0,0,0.5)'
                : '0 0 0 3px var(--panel-solid), 0 0 0 5px color-mix(in srgb, var(--accent) 45%, transparent), 0 18px 40px rgba(0,0,0,0.5)',
            marginBottom: 14, overflow: 'hidden',
          } as React.CSSProperties}>
          {img && (
            <img key={p.id} src={img} alt={p.name} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', borderRadius: 'inherit', zIndex: 1,
              opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.25s ease-in',
            }}
            onLoad={() => setImgLoaded(true)}
            onError={e => (e.currentTarget.style.display = 'none')} />
          )}
          <span>{initials(p.name)}</span>
        </div>

        {detail?.pronouns && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-faint)', marginBottom: 4 }}>{detail.pronouns}</div>}
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 21, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {p.name}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {p.flag} {p.location || p.country}
        </div>
        {/* Social icons inline in hero */}
        {socials.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {socials.map(([key, val]) => (
              <a key={key} href={socialHref(key, val!)} target="_blank" rel="noopener"
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-faint)',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = ''; }}
                dangerouslySetInnerHTML={{ __html: SOCIAL_SVGS[key] || SOCIAL_SVGS.website }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {/* Tier badges + company */}
        {p.company && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>{p.company}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {isGold && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '4px 9px', borderRadius: 5,
              background: 'rgba(245,158,11,0.1)', color: 'var(--gold-soft)',
              border: '1px solid rgba(245,158,11,0.35)',
            }}>★ Golden Kubestronaut</span>
          )}
          {!isGold && p.tier === 'regular' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '4px 9px', borderRadius: 5,
              background: 'rgba(56,189,248,0.1)', color: 'color-mix(in srgb, var(--accent) 60%, white)',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            }}>Kubestronaut</span>
          )}
          {p.isAmbassador && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '4px 9px', borderRadius: 5,
              background: 'rgba(168,85,247,0.12)', color: '#c084fc',
              border: '1px solid rgba(168,85,247,0.4)',
            }}>CNCF Ambassador</span>
          )}
        </div>

        {/* Bio — only show when loaded */}
        {detail?.bio && (
          <>
            <h5 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, margin: '16px 0 8px' }}>Bio</h5>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7,
              borderLeft: `2px solid ${isGold ? 'rgba(245,158,11,0.4)' : p.isAmbassador ? 'rgba(168,85,247,0.4)' : 'color-mix(in srgb, var(--accent) 30%, transparent)'}`,
              padding: '2px 0 2px 12px',
              animation: 'viewFadeIn .3s ease-out',
            }}>
              {detail.bio}
            </div>
          </>
        )}

        {/* Certs summary */}
        {showCerts && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginTop: 14,
            background: isGold ? 'rgba(245,158,11,0.08)' : 'color-mix(in srgb, var(--accent) 8%, transparent)',
            border: `1px solid ${isGold ? 'rgba(245,158,11,0.25)' : 'color-mix(in srgb, var(--accent) 25%, transparent)'}`,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 14 }}>{isGold ? '★' : '✓'}</span>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: isGold ? 'var(--gold-soft)' : 'var(--accent)' }}>
                {isGold ? 'Golden Kubestronaut' : 'Kubestronaut'}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                All required CNCF certifications
              </div>
            </div>
          </div>
        )}

        {/* Projects */}
        {p.projects.length > 0 && (
          <>
            <h5 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, margin: '16px 0 8px' }}>Projects</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {p.projects.slice(0, 12).map(t => (
                <span key={t} style={{
                  display: 'inline-block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                  color: 'var(--text-dim)', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 999, padding: '3px 9px',
                }}>{t}</span>
              ))}
            </div>
          </>
        )}

        {/* Languages */}
        {detail && detail.languages.length > 0 && (
          <>
            <h5 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, margin: '16px 0 8px' }}>Languages</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {detail.languages.map(t => (
                <span key={t} style={{
                  display: 'inline-block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                  color: 'var(--text-dim)', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 999, padding: '3px 9px',
                }}>{t}</span>
              ))}
            </div>
          </>
        )}

        {/* Socials moved to hero */}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <ShareButton person={p} />
        <DownloadCardButton person={p} isGold={isGold} />
      </div>
    </aside>
  );
}

function ShareButton({ person }: { person: PersonCore }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => {
      navigator.clipboard?.writeText(`https://kubemap.app/k/${person.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }} style={{
      flex: 1,
      background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
      border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
      color: 'color-mix(in srgb, var(--accent) 70%, white)',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, borderRadius: 8,
      padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
    }}>
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {copied
          ? <path d="M20 6 9 17l-5-5" />
          : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
        }
      </svg>
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  );
}

function DownloadCardButton({ person, isGold }: { person: PersonCore; isGold: boolean }) {
  const [gen, setGen] = useState(false);
  return (
    <button onClick={async () => {
      setGen(true);
      try {
        const blob = await generateProfileCard(person);
        downloadBlob(blob, `kubemap-${person.id}.png`);
      } finally { setGen(false); }
    }} disabled={gen} style={{
      flex: 1,
      background: isGold ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.08)',
      border: `1px solid ${isGold ? 'rgba(251,191,36,0.35)' : 'rgba(56,189,248,0.25)'}`,
      color: isGold ? '#fbbf24' : '#38bdf8',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, borderRadius: 8,
      padding: '9px 12px', cursor: gen ? 'wait' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      opacity: gen ? 0.6 : 1,
    }}>
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      {gen ? 'Generating...' : 'Download card'}
    </button>
  );
}
