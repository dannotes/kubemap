import { useState } from 'react';

interface Cert {
  abbr: string;
  name: string;
  desc: string;
  ring: 'kubestronaut' | 'golden';
  url: string;
}

const CERTS: Cert[] = [
  // Kubestronaut ring (inner 5)
  { abbr: 'KCNA', name: 'Kubernetes and Cloud Native Associate', desc: 'Validates foundational knowledge of Kubernetes and the cloud-native ecosystem including container orchestration, cloud-native architecture, and the CNCF landscape.', ring: 'kubestronaut', url: 'https://training.linuxfoundation.org/certification/kubernetes-cloud-native-associate/' },
  { abbr: 'KCSA', name: 'Kubernetes and Cloud Security Associate', desc: 'Tests understanding of cloud-native security fundamentals including Kubernetes threat models, platform security, compliance frameworks, and security best practices.', ring: 'kubestronaut', url: 'https://training.linuxfoundation.org/certification/kubernetes-and-cloud-native-security-associate-kcsa/' },
  { abbr: 'CKA', name: 'Certified Kubernetes Administrator', desc: 'Hands-on performance exam covering cluster architecture, workloads, networking, storage, and troubleshooting. The foundational professional certification for Kubernetes.', ring: 'kubestronaut', url: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/' },
  { abbr: 'CKAD', name: 'Certified Kubernetes Application Developer', desc: 'Performance-based exam testing ability to design, build, configure, and deploy cloud-native applications for Kubernetes. Focuses on the developer workflow.', ring: 'kubestronaut', url: 'https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/' },
  { abbr: 'CKS', name: 'Certified Kubernetes Security Specialist', desc: 'Advanced hands-on exam covering cluster hardening, microservice vulnerabilities, supply chain security, monitoring and runtime protection. Requires active CKA.', ring: 'kubestronaut', url: 'https://training.linuxfoundation.org/certification/certified-kubernetes-security-specialist/' },
  // Golden ring (outer 11)
  { abbr: 'PCA', name: 'Prometheus Certified Associate', desc: 'Covers Prometheus architecture, PromQL queries, instrumentation, alerting rules, service discovery, and dashboarding for cloud-native observability.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/prometheus-certified-associate/' },
  { abbr: 'ICA', name: 'Istio Certified Associate', desc: 'Validates knowledge of Istio service mesh including traffic management, security policies, observability, and troubleshooting mesh configurations.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/istio-certified-associate-ica/' },
  { abbr: 'CCA', name: 'Cilium Certified Associate', desc: 'Tests understanding of eBPF-based networking with Cilium including network policies, service mesh, observability, and multi-cluster connectivity.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/cilium-certified-associate-cca/' },
  { abbr: 'CAPA', name: 'Certified Argo Project Associate', desc: 'Covers the Argo ecosystem — Argo CD for GitOps deployments, Argo Workflows for CI/CD pipelines, Argo Rollouts for progressive delivery, and Argo Events.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/certified-argo-project-associate-capa/' },
  { abbr: 'CGOA', name: 'Certified GitOps Associate', desc: 'Validates understanding of GitOps principles, declarative infrastructure, reconciliation loops, and tooling including Argo CD and Flux.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/certified-gitops-associate-cgoa/' },
  { abbr: 'CBA', name: 'Certified Backstage Associate', desc: 'Tests knowledge of Backstage developer portals including the software catalog, scaffolder, TechDocs, plugin development, and platform customization.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/certified-backstage-associate-cba/' },
  { abbr: 'OTCA', name: 'OpenTelemetry Certified Associate', desc: 'Covers observability fundamentals with OpenTelemetry — the API, SDK, Collector architecture, instrumentation patterns, and pipeline management.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/opentelemetry-certified-associate-otca/' },
  { abbr: 'KCA', name: 'Kyverno Certified Associate', desc: 'Validates ability to write and manage Kyverno policies for Kubernetes — validation, mutation, generation rules, and policy enforcement.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/kyverno-certified-associate-kca/' },
  { abbr: 'LFCS', name: 'Linux Foundation Certified SysAdmin', desc: 'Hands-on exam covering Linux system administration — file systems, networking, storage, user management, security, and service configuration.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/' },
  { abbr: 'CNPA', name: 'Cloud Native Platform Engineering Associate', desc: 'Covers platform engineering fundamentals — internal developer platforms, observability, security, continuous delivery, and developer experience.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/cloud-native-platform-engineering-associate/' },
  { abbr: 'CNPE', name: 'Cloud Native Platform Engineer', desc: 'Advanced hands-on exam for platform engineers covering platform architecture, GitOps workflows, platform APIs, observability, and security policy enforcement.', ring: 'golden', url: 'https://training.linuxfoundation.org/certification/cloud-native-platform-engineer/' },
];

const INNER = CERTS.filter(c => c.ring === 'kubestronaut');
const OUTER = CERTS.filter(c => c.ring === 'golden');

export function CertsView() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedRing, setSelectedRing] = useState<'all' | 'kubestronaut' | 'golden'>('all');

  const selectedCert = selected ? CERTS.find(c => c.abbr === selected) : null;

  const cx = 400, cy = 370;
  const innerR = 155, outerR = 305;
  const innerNodeR = 34, outerNodeR = 30;
  const centerR = 60;

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
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--text)' }}>Certs</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            certification path
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'kubestronaut', 'golden'] as const).map(r => (
            <button key={r} onClick={() => setSelectedRing(r)} style={{
              background: selectedRing === r ? 'var(--surface-2)' : 'var(--surface)',
              color: selectedRing === r ? (r === 'golden' ? 'var(--gold-soft)' : r === 'kubestronaut' ? 'var(--accent)' : 'var(--text)') : 'var(--text-dim)',
              border: `1px solid ${selectedRing === r ? 'var(--border-strong)' : 'var(--border)'}`,
              borderRadius: 6, padding: '6px 10px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer',
            }}>
              {r === 'all' ? 'All 16 certs' : r === 'kubestronaut' ? 'Kubestronaut (5)' : '★ Golden (16)'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Orbit visualization */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 800 740" style={{ width: '100%', maxWidth: 860, height: 'auto' }}>
            <defs>
              <filter id="glow-blue"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="glow-gold"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>

            {/* Outer orbit ring */}
            {(selectedRing === 'all' || selectedRing === 'golden') && (
              <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth={1} strokeDasharray="6 4" />
            )}

            {/* Inner orbit ring */}
            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(56,189,248,0.18)" strokeWidth={1} strokeDasharray="6 4" />

            {/* Connection lines inner → center */}
            {INNER.map((cert, i) => {
              const angle = (i / INNER.length) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(angle) * innerR;
              const y = cy + Math.sin(angle) * innerR;
              return <line key={`il-${cert.abbr}`} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(56,189,248,0.07)" strokeWidth={1} />;
            })}

            {/* Connection lines outer → inner */}
            {(selectedRing === 'all' || selectedRing === 'golden') && OUTER.map((cert, i) => {
              const angle = (i / OUTER.length) * Math.PI * 2 - Math.PI / 2;
              const ox = cx + Math.cos(angle) * outerR;
              const oy = cy + Math.sin(angle) * outerR;
              const ni = Math.round((i / OUTER.length) * INNER.length) % INNER.length;
              const iAngle = (ni / INNER.length) * Math.PI * 2 - Math.PI / 2;
              const ix = cx + Math.cos(iAngle) * innerR;
              const iy = cy + Math.sin(iAngle) * innerR;
              return <line key={`ol-${cert.abbr}`} x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(251,191,36,0.05)" strokeWidth={1} />;
            })}

            {/* Center badge */}
            <circle cx={cx} cy={cy} r={centerR} fill="rgba(56,189,248,0.06)"
              stroke={selectedRing === 'golden' ? 'rgba(251,191,36,0.35)' : 'rgba(56,189,248,0.25)'} strokeWidth={1.5} />
            <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text)" fontFamily="'DM Sans', sans-serif" fontWeight="800" fontSize="14">
              {selectedRing === 'golden' ? '★ GOLDEN' : 'KUBESTRONAUT'}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontFamily="'JetBrains Mono', monospace" fontSize="10">
              {selectedRing === 'golden' ? '16 certifications' : '5 certifications'}
            </text>

            {/* Inner ring nodes */}
            {INNER.map((cert, i) => {
              const angle = (i / INNER.length) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(angle) * innerR;
              const y = cy + Math.sin(angle) * innerR;
              const isHov = hovered === cert.abbr;
              const isSel = selected === cert.abbr;

              return (
                <g key={cert.abbr}
                  onMouseEnter={() => setHovered(cert.abbr)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(isSel ? null : cert.abbr)}
                  style={{ cursor: 'pointer' }}
                >
                  {(isHov || isSel) && <circle cx={x} cy={y} r={innerNodeR + 10} fill="none" stroke="rgba(56,189,248,0.4)" strokeWidth={2} filter="url(#glow-blue)" />}
                  <circle cx={x} cy={y} r={innerNodeR}
                    fill={isSel ? 'rgba(56,189,248,0.22)' : isHov ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.06)'}
                    stroke={isSel || isHov ? 'rgba(56,189,248,0.8)' : 'rgba(56,189,248,0.35)'}
                    strokeWidth={isSel || isHov ? 2 : 1.5} />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={isSel || isHov ? '#38bdf8' : 'var(--text)'}
                    fontFamily="'JetBrains Mono', monospace" fontWeight="700" fontSize="12">
                    {cert.abbr}
                  </text>
                </g>
              );
            })}

            {/* Outer ring nodes */}
            {(selectedRing === 'all' || selectedRing === 'golden') && OUTER.map((cert, i) => {
              const angle = (i / OUTER.length) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(angle) * outerR;
              const y = cy + Math.sin(angle) * outerR;
              const isHov = hovered === cert.abbr;
              const isSel = selected === cert.abbr;

              return (
                <g key={cert.abbr}
                  onMouseEnter={() => setHovered(cert.abbr)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(isSel ? null : cert.abbr)}
                  style={{ cursor: 'pointer' }}
                >
                  {(isHov || isSel) && <circle cx={x} cy={y} r={outerNodeR + 10} fill="none" stroke="rgba(251,191,36,0.4)" strokeWidth={2} filter="url(#glow-gold)" />}
                  <circle cx={x} cy={y} r={outerNodeR}
                    fill={isSel ? 'rgba(251,191,36,0.22)' : isHov ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.06)'}
                    stroke={isSel || isHov ? 'rgba(251,191,36,0.8)' : 'rgba(251,191,36,0.28)'}
                    strokeWidth={isSel || isHov ? 2 : 1.5} />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={isSel || isHov ? '#fbbf24' : 'var(--text)'}
                    fontFamily="'JetBrains Mono', monospace" fontWeight="700" fontSize="10">
                    {cert.abbr}
                  </text>
                </g>
              );
            })}

            {/* Ring labels */}
            <text x={cx} y={cy - innerR - innerNodeR - 12} textAnchor="middle"
              fill="rgba(56,189,248,0.45)" fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="0.14em">
              KUBESTRONAUT PATH
            </text>
            {(selectedRing === 'all' || selectedRing === 'golden') && (
              <text x={cx} y={cy - outerR - outerNodeR - 12} textAnchor="middle"
                fill="rgba(251,191,36,0.45)" fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="0.14em">
                ★ GOLDEN PATH
              </text>
            )}
          </svg>
        </div>

        {/* Cert detail panel (right side) */}
        <aside style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 380,
          background: 'var(--panel)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          borderLeft: '1px solid var(--border)',
          transform: selectedCert ? 'translateX(0)' : 'translateX(110%)',
          transition: 'transform .32s cubic-bezier(.4,0,.2,1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: selectedCert ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
        }}>
          {selectedCert && (
            <>
              {/* Close */}
              <button onClick={() => setSelected(null)} style={{
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
                background: selectedCert.ring === 'kubestronaut'
                  ? 'linear-gradient(180deg, rgba(56,189,248,0.12), transparent 70%)'
                  : 'linear-gradient(180deg, rgba(251,191,36,0.12), transparent 70%)',
              }}>
                {/* Circle icon */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: selectedCert.ring === 'kubestronaut' ? 'rgba(56,189,248,0.1)' : 'rgba(251,191,36,0.1)',
                  border: `2px solid ${selectedCert.ring === 'kubestronaut' ? 'rgba(56,189,248,0.5)' : 'rgba(251,191,36,0.5)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 16,
                  color: selectedCert.ring === 'kubestronaut' ? '#38bdf8' : '#fbbf24',
                  marginBottom: 16,
                  boxShadow: `0 0 30px ${selectedCert.ring === 'kubestronaut' ? 'rgba(56,189,248,0.3)' : 'rgba(251,191,36,0.3)'}`,
                }}>
                  {selectedCert.abbr}
                </div>

                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {selectedCert.name}
                </div>
                <div style={{
                  marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.12em',
                  textTransform: 'uppercase', padding: '4px 9px', borderRadius: 5,
                  background: selectedCert.ring === 'kubestronaut' ? 'rgba(56,189,248,0.1)' : 'rgba(251,191,36,0.1)',
                  color: selectedCert.ring === 'kubestronaut' ? '#38bdf8' : '#fbbf24',
                  border: `1px solid ${selectedCert.ring === 'kubestronaut' ? 'rgba(56,189,248,0.3)' : 'rgba(251,191,36,0.3)'}`,
                }}>
                  {selectedCert.ring === 'kubestronaut' ? 'Kubestronaut Path' : '★ Golden Path'}
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
                <h5 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 8px' }}>About this certification</h5>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.7,
                  borderLeft: `2px solid ${selectedCert.ring === 'kubestronaut' ? 'rgba(56,189,248,0.4)' : 'rgba(251,191,36,0.4)'}`,
                  padding: '2px 0 2px 12px', marginBottom: 16,
                }}>
                  {selectedCert.desc}
                </div>

                {/* Cert position in path */}
                <h5 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, margin: '16px 0 8px' }}>
                  {selectedCert.ring === 'kubestronaut' ? 'Kubestronaut requires all 5' : 'Golden requires all 16'}
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(selectedCert.ring === 'kubestronaut' ? INNER : CERTS).map(c => (
                    <span key={c.abbr} onClick={() => setSelected(c.abbr)} style={{
                      display: 'inline-block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                      color: c.abbr === selectedCert.abbr
                        ? (c.ring === 'kubestronaut' ? '#38bdf8' : '#fbbf24')
                        : 'var(--text-dim)',
                      background: c.abbr === selectedCert.abbr
                        ? (c.ring === 'kubestronaut' ? 'rgba(56,189,248,0.15)' : 'rgba(251,191,36,0.15)')
                        : 'var(--surface)',
                      border: `1px solid ${c.abbr === selectedCert.abbr
                        ? (c.ring === 'kubestronaut' ? 'rgba(56,189,248,0.4)' : 'rgba(251,191,36,0.4)')
                        : 'var(--border)'}`,
                      borderRadius: 999, padding: '3px 9px', cursor: 'pointer',
                    }}>{c.abbr}</span>
                  ))}
                </div>
              </div>

              {/* Footer — Exam page link */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
                <a href={selectedCert.url} target="_blank" rel="noopener" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  background: selectedCert.ring === 'kubestronaut' ? 'rgba(56,189,248,0.12)' : 'rgba(251,191,36,0.12)',
                  border: `1px solid ${selectedCert.ring === 'kubestronaut' ? 'rgba(56,189,248,0.35)' : 'rgba(251,191,36,0.35)'}`,
                  color: selectedCert.ring === 'kubestronaut' ? '#38bdf8' : '#fbbf24',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
                  textDecoration: 'none', cursor: 'pointer',
                }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                  </svg>
                  View on Linux Foundation
                </a>
              </div>
            </>
          )}
        </aside>

        {/* Hint (only when no cert selected) */}
        {!selectedCert && (
          <div style={{
            position: 'absolute', top: 12, right: 16,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)',
          }}>
            click a certification for details
          </div>
        )}
      </div>
    </div>
  );
}
