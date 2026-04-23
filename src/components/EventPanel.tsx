import { useMemo } from 'react';
import { useStore } from '../store/store';

export function EventPanel() {
  const eventId = useStore(s => s.eventId);
  const events = useStore(s => s.events);
  const openEvent = useStore(s => s.openEvent);

  const event = useMemo(() => {
    if (!eventId) return null;
    return events.find(e => e.id === eventId) || null;
  }, [eventId, events]);

  if (!event) {
    return (
      <aside style={{
        position: 'fixed', top: 56, right: 0, bottom: 28, width: 400,
        background: 'var(--panel)', backdropFilter: 'blur(18px)',
        borderLeft: '1px solid var(--border)',
        transform: 'translateX(110%)', transition: 'transform .32s cubic-bezier(.4,0,.2,1)',
        zIndex: 420,
      }} />
    );
  }

  const daysUntil = Math.ceil((new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isMultiDay = event.startDate !== event.endDate;
  const dateStr = isMultiDay
    ? `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
    : formatDate(event.startDate);
  const countdownStr = daysUntil > 1 ? `in ${daysUntil} days` : daysUntil === 1 ? 'Tomorrow' : daysUntil === 0 ? 'Today!' : `${-daysUntil}d ago`;

  return (
    <aside style={{
      position: 'fixed', top: 56, right: 0, bottom: 28, width: 400,
      background: 'var(--panel)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      borderLeft: '1px solid var(--border)',
      transform: 'translateX(0)', transition: 'transform .32s cubic-bezier(.4,0,.2,1)',
      zIndex: 420, display: 'flex', flexDirection: 'column',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
    }}>
      {/* Close */}
      <button onClick={() => openEvent(null)} style={{
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
        padding: '30px 20px 20px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, rgba(34,197,94,0.14), transparent 70%)',
      }}>
        {/* Logo or diamond icon */}
        {event.logo ? (
          <img src={event.logo} alt="" style={{
            width: 64, height: 64, borderRadius: 12, objectFit: 'contain',
            background: 'var(--surface)', border: '1px solid var(--border)',
            marginBottom: 16,
          }} />
        ) : (
          <div style={{
            width: 52, height: 52, transform: 'rotate(45deg)', borderRadius: 8,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 3px var(--panel-solid), 0 0 0 5px rgba(34,197,94,0.6), 0 0 30px rgba(34,197,94,0.4)',
            marginBottom: 16,
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="white" style={{ transform: 'rotate(-45deg)' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" fill="none" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        )}

        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 19, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {event.title}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {dateStr}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
          color: daysUntil >= 0 ? '#22c55e' : 'var(--text-faint)', marginTop: 4,
        }}>
          {countdownStr}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          {event.flag} {event.city}, {event.country}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {/* Description */}
        {event.description && (
          <>
            <h5 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 8px' }}>About</h5>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.7,
              borderLeft: '2px solid rgba(34,197,94,0.4)', padding: '2px 0 2px 12px', marginBottom: 16,
            }}>
              {event.description}
            </div>
          </>
        )}

      </div>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a href={event.url} target="_blank" rel="noopener" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '10px 14px', borderRadius: 8,
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)',
          color: '#22c55e', fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
          textDecoration: 'none', cursor: 'pointer',
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
          </svg>
          Register / Event Details
        </a>
        <a href={calendarUrl(event)} target="_blank" rel="noopener" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '10px 14px', borderRadius: 8,
          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
          color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
          textDecoration: 'none', cursor: 'pointer',
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Add to Calendar
        </a>
      </div>
    </aside>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calendarUrl(ev: { title: string; startDate: string; endDate: string; city: string; country: string; url: string }): string {
  const start = ev.startDate.replace(/-/g, '');
  // End date: add one day for all-day event
  const end = new Date(ev.endDate + 'T00:00:00');
  end.setDate(end.getDate() + 1);
  const endStr = end.toISOString().split('T')[0].replace(/-/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${endStr}`,
    location: `${ev.city}, ${ev.country}`,
    details: `Register: ${ev.url}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
