import { useState, useEffect } from 'react';

export function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    function tick() {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setTime(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`);
    }
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, height: 28,
      background: 'var(--panel-solid)', borderTop: '1px solid var(--border)',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)',
      display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', gap: 20, padding: '0 18px', zIndex: 450,
    }}>
      <div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', animation: 'liveBlink 2s ease-in-out infinite' }} />
          live · {time}
        </span>
      </div>
      <div>
        <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>
          Not affiliated with the CNCF · Community directory · v0.3
        </span>
      </div>
      <div style={{ textAlign: 'right' }}>© 2026 kubemap.io</div>
    </footer>
  );
}
