import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { useIsMobile } from '../lib/useIsMobile';

export function HeroEntrance() {
  const loading = useStore(s => s.loading);
  const loadingMsg = useStore(s => s.loadingMsg);
  const stats = useStore(s => s.stats);
  const people = useStore(s => s.people);
  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<'loading' | 'reveal' | 'fading' | 'done'>('loading');
  const shownRef = useState(() => sessionStorage.getItem('kubemap-hero-shown') === '1')[0];

  // Skip if already shown this session
  useEffect(() => {
    if (shownRef) setPhase('done');
  }, [shownRef]);

  // Transition from loading → reveal when data arrives
  useEffect(() => {
    if (shownRef || phase !== 'loading') return;
    if (!loading && people.length > 0) {
      setPhase('reveal');
      sessionStorage.setItem('kubemap-hero-shown', '1');
      setTimeout(() => dismiss(), 3400);
    }
  }, [loading, people.length]);

  function dismiss() {
    setPhase(prev => {
      if (prev === 'fading' || prev === 'done') return prev;
      setTimeout(() => setPhase('done'), 700);
      return 'fading';
    });
  }

  if (phase === 'done') return null;

  const total = people.length;
  const countries = stats?.topCountries ? stats.topCountries.length : 0;
  // Round to nearest hundred with +
  const displayCount = total > 0 ? `${Math.floor(total / 100) * 100}+` : '';

  return (
    <div
      onClick={() => phase === 'reveal' && dismiss()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: phase === 'reveal' ? 'pointer' : 'default',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity .6s ease',
      }}
    >
      {/* Logo */}
      <div style={{
        filter: 'drop-shadow(0 0 30px rgba(56,189,248,0.5))',
        marginBottom: 28,
        animation: phase === 'loading' ? 'logoPulse 2s ease-in-out infinite' : 'none',
        transform: phase === 'reveal' || phase === 'fading' ? 'scale(1)' : 'scale(0.9)',
        transition: 'transform .4s ease',
      }}>
        <svg viewBox="0 0 32 32" width={isMobile ? 56 : 72} height={isMobile ? 56 : 72}>
          <defs>
            <linearGradient id="logo-h" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#326ce5"/>
              <stop offset="50%" stopColor="#38bdf8"/>
              <stop offset="100%" stopColor="#06b6d4"/>
            </linearGradient>
          </defs>
          <path d="M16 1C9.4 1 4 6.1 4 12.3c0 8.5 10.3 17.5 11.2 18.3a1.2 1.2 0 0 0 1.6 0C17.7 29.8 28 20.8 28 12.3 28 6.1 22.6 1 16 1z" fill="url(#logo-h)"/>
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

      {phase === 'loading' && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-muted)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <span>{loadingMsg}<span className="dots" /></span>
        </div>
      )}

      {(phase === 'reveal' || phase === 'fading') && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          animation: 'heroReveal .5s ease-out',
        }}>
          {/* Big number */}
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 800,
            fontSize: isMobile ? 56 : 80, lineHeight: 1,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #38bdf8, #06b6d4, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {displayCount}
          </div>

          {/* Tagline */}
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            fontSize: isMobile ? 16 : 20, color: 'var(--text)',
            letterSpacing: '-0.01em',
          }}>
            Kubestronauts worldwide
          </div>

          {/* Sub stats */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 11 : 13,
            color: 'var(--text-muted)', marginTop: 4,
          }}>
            <span>{countries}+ countries</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ color: 'var(--green)' }}>live</span>
          </div>

          {/* Tap to continue */}
          <div style={{
            marginTop: isMobile ? 32 : 48,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: 'var(--text-faint)', letterSpacing: '0.06em',
            animation: 'heroBlink 2s ease-in-out infinite',
          }}>
            {isMobile ? 'tap to explore' : 'click anywhere to explore'}
          </div>
        </div>
      )}
    </div>
  );
}
