const AV_COLORS = [
  'linear-gradient(135deg,#1e293b,#0f172a)',
  'linear-gradient(135deg,#1e2433,#111827)',
  'linear-gradient(135deg,#1a2332,#0c1524)',
  'linear-gradient(135deg,#1c2030,#10141f)',
  'linear-gradient(135deg,#1f2537,#121828)',
  'linear-gradient(135deg,#1a2030,#0e1420)',
  'linear-gradient(135deg,#1d2335,#111726)',
];

export function avColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

export function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hashStr(s: string): number {
  let h = 0;
  for (const c of (s || '')) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

export function jitterOffset(id: string, radiusDeg = 0.12): [number, number] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  const a = (h % 360) * Math.PI / 180;
  const r = ((Math.abs(h) % 100) / 100) * radiusDeg;
  return [Math.sin(a) * r, Math.cos(a) * r];
}

const IMG_BASE = 'https://raw.githubusercontent.com/cncf/people/main/images/';

export function imageUrl(filename: string | null): string | null {
  if (!filename) return null;
  return IMG_BASE + filename;
}
