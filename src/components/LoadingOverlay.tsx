import { useStore } from '../store/store';

export function LoadingOverlay() {
  const { loading, loadingMsg } = useStore();

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed', top: 56, right: 0, bottom: 28, left: 340,
      background: 'var(--bg)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-muted)',
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #326ce5 0%, #38bdf8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(56,189,248,0.35), 0 0 20px rgba(56,189,248,0.3)',
        }}>
          <svg viewBox="0 0 24 24" width={24} height={24} fill="white">
            <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.5 6.5 3.6L12 11.7 5.5 8.1 12 4.5ZM5 9.8l6 3.3v6.9l-6-3.3V9.8Zm14 0v6.9l-6 3.3v-6.9l6-3.3Z" />
          </svg>
        </div>
        <span>{loadingMsg}<span className="dots" /></span>
      </div>
    </div>
  );
}
