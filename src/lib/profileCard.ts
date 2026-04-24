import type { PersonCore } from './types';

const W = 1200;
const H = 630;

// Certs every Kubestronaut earns
const K8S_CERTS = ['CKA', 'CKAD', 'CKS', 'KCNA', 'KCSA'];
// Additional certs for Golden
const GOLDEN_EXTRA = ['PCA', 'ICA', 'CCA', 'CAPA', 'CGOA', 'CBA', 'OTCA', 'KCA', 'LFCS', 'CNPA', 'CNPE'];

export async function generateProfileCard(person: PersonCore): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const isGold = person.tier === 'golden';
  const isAmb = person.isAmbassador && !isGold;
  const tierColor = isGold ? '#fbbf24' : isAmb ? '#c084fc' : '#38bdf8';
  const tierGlow = isGold ? 'rgba(251,191,36,' : isAmb ? 'rgba(192,132,252,' : 'rgba(56,189,248,';
  const tierLabel = isGold ? 'GOLDEN KUBESTRONAUT' : isAmb ? 'CNCF AMBASSADOR' : 'KUBESTRONAUT';
  const certs = isGold ? [...K8S_CERTS, ...GOLDEN_EXTRA] : K8S_CERTS;

  // === BACKGROUND ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#080c18');
  bg.addColorStop(0.4, '#0c1224');
  bg.addColorStop(1, '#080e1c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Central glow behind photo area
  const glow = ctx.createRadialGradient(W / 2, 160, 20, W / 2, 200, 360);
  glow.addColorStop(0, `${tierGlow}0.12)`);
  glow.addColorStop(0.5, `${tierGlow}0.04)`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Stars
  drawStars(ctx, 50);

  // Top border
  drawGradientBorder(ctx, 0, 0, W, 3, tierColor, tierGlow);
  // Bottom border
  drawGradientBorder(ctx, 0, H - 3, W, 3, tierColor, tierGlow);

  // === PHOTO — centered, large ===
  const photoX = W / 2;
  const photoY = 125;
  const photoR = 68;

  // Outer decorative ring
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoR + 18, 0, Math.PI * 2);
  ctx.strokeStyle = `${tierGlow}0.08)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Glow ring
  ctx.save();
  ctx.shadowColor = `${tierGlow}0.6)`;
  ctx.shadowBlur = 35;
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoR + 4, 0, Math.PI * 2);
  ctx.strokeStyle = tierColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Photo clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2);
  ctx.clip();
  let photoLoaded = false;
  if (person.image) {
    try {
      const img = await loadImage(`https://raw.githubusercontent.com/cncf/people/main/images/${person.image}`);
      ctx.drawImage(img, photoX - photoR, photoY - photoR, photoR * 2, photoR * 2);
      photoLoaded = true;
    } catch { /* fallback */ }
  }
  if (!photoLoaded) {
    const fbg = ctx.createLinearGradient(photoX - photoR, photoY - photoR, photoX + photoR, photoY + photoR);
    fbg.addColorStop(0, '#1e293b');
    fbg.addColorStop(1, '#0f172a');
    ctx.fillStyle = fbg;
    ctx.fillRect(photoX - photoR, photoY - photoR, photoR * 2, photoR * 2);
    ctx.fillStyle = '#475569';
    ctx.font = '700 40px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const parts = person.name.split(/\s+/);
    const ini = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
    ctx.fillText(ini.toUpperCase(), photoX, photoY);
  }
  ctx.restore();

  // === NAME — big, bold, centered ===
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '800 42px "DM Sans", sans-serif';
  let displayName = person.name;
  while (ctx.measureText(displayName).width > 800 && displayName.length > 10) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== person.name) displayName += '...';
  ctx.fillText(displayName, W / 2, 210);

  // === TIER — the hero, centered, large ===
  ctx.font = '700 15px "JetBrains Mono", monospace';
  ctx.fillStyle = tierColor;
  ctx.fillText(tierLabel, W / 2, 262);

  // === COMPANY + LOCATION — one line ===
  ctx.font = '500 14px "JetBrains Mono", monospace';
  ctx.fillStyle = '#64748b';
  let infoStr = person.flag + '  ' + person.country;
  if (person.company) infoStr = person.company + '  ·  ' + infoStr;
  ctx.fillText(infoStr, W / 2, 286);

  // === CERT BADGES ROW — the trophies ===
  const certY = 325;
  const showCerts = isGold || person.tier === 'regular';
  if (showCerts) {
    const badgeH = 28;
    const badgeGap = 6;
    const badgeR = 5;

    // Measure total width
    ctx.font = '700 10px "JetBrains Mono", monospace';
    const badgeWidths = certs.map(c => ctx.measureText(c).width + 18);
    const totalW = badgeWidths.reduce((a, b) => a + b, 0) + (certs.length - 1) * badgeGap;
    let bx = (W - totalW) / 2;

    for (let i = 0; i < certs.length; i++) {
      const c = certs[i];
      const bw = badgeWidths[i];
      const isCore = i < 5;
      const color = isCore ? '#38bdf8' : '#fbbf24';
      const colorAlpha = isCore ? 'rgba(56,189,248,' : 'rgba(251,191,36,';

      roundRect(ctx, bx, certY, bw, badgeH, badgeR);
      ctx.fillStyle = `${colorAlpha}0.1)`;
      ctx.fill();
      ctx.strokeStyle = `${colorAlpha}0.35)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c, bx + bw / 2, certY + badgeH / 2);

      bx += bw + badgeGap;
    }
  }

  // Ambassador badge row (if ambassador but not golden — no certs to show)
  if (isAmb) {
    ctx.font = '700 11px "JetBrains Mono", monospace';
    const ambBadges = ['COMMUNITY LEADER', 'CNCF ADVOCATE', 'SPEAKER'];
    const abGap = 8;
    const abH = 28;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    const abWidths = ambBadges.map(b => ctx.measureText(b).width + 22);
    const abTotalW = abWidths.reduce((a, b) => a + b, 0) + (ambBadges.length - 1) * abGap;
    let ax = (W - abTotalW) / 2;

    for (let i = 0; i < ambBadges.length; i++) {
      const bw = abWidths[i];
      roundRect(ctx, ax, certY, bw, abH, 5);
      ctx.fillStyle = 'rgba(192,132,252,0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(192,132,252,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ambBadges[i], ax + bw / 2, certY + abH / 2);
      ax += bw + abGap;
    }
  }

  // === PROJECTS (if any) ===
  if (person.projects.length > 0) {
    const projY = certY + 42;
    ctx.font = '400 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const projStr = person.projects.slice(0, 8).join('  ·  ');
    ctx.fillText(projStr, W / 2, projY);
  }

  // === "1 of 3,843" — PROMINENT with decorative lines ===
  const commY = 400;

  // Left line
  const commText = '1  of  3,843  Kubestronauts  worldwide';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  const commW = ctx.measureText(commText).width;
  const lineGap = 20;
  const lineLen = 120;

  ctx.strokeStyle = `${tierGlow}0.2)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - commW / 2 - lineGap - lineLen, commY + 8);
  ctx.lineTo(W / 2 - commW / 2 - lineGap, commY + 8);
  ctx.stroke();

  // Right line
  ctx.beginPath();
  ctx.moveTo(W / 2 + commW / 2 + lineGap, commY + 8);
  ctx.lineTo(W / 2 + commW / 2 + lineGap + lineLen, commY + 8);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(commText, W / 2, commY);

  // === STAT LINE — clean summary ===
  const statLineY = 440;
  const statParts: string[] = [];
  if (isGold) statParts.push('16 Certifications');
  else if (person.tier === 'regular') statParts.push('5 Certifications');
  if (person.isAmbassador) statParts.push('Ambassador');
  if (person.projects.length > 0) statParts.push(`${person.projects.length} Projects`);

  if (statParts.length > 0) {
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Draw each part with tier-colored numbers and dots between
    const statStr = statParts.join('  ·  ');
    const fullW = ctx.measureText(statStr).width;
    let sx = (W - fullW) / 2;

    for (let i = 0; i < statParts.length; i++) {
      const part = statParts[i];
      ctx.fillStyle = tierColor;
      ctx.textAlign = 'left';
      ctx.fillText(part, sx, statLineY);
      sx += ctx.measureText(part).width;

      if (i < statParts.length - 1) {
        ctx.fillStyle = '#2a3450';
        ctx.fillText('  ·  ', sx, statLineY);
        sx += ctx.measureText('  ·  ').width;
      }
    }
  }

  // === TAGLINE — large, gradient text ===
  const tagY = statLineY + 36;
  const tagText = 'Building the future of cloud native.';
  ctx.font = '700 22px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const tagW = ctx.measureText(tagText).width;
  const tagGrad = ctx.createLinearGradient(W / 2 - tagW / 2, tagY, W / 2 + tagW / 2, tagY);
  tagGrad.addColorStop(0, '#475569');
  tagGrad.addColorStop(0.3, tierColor);
  tagGrad.addColorStop(0.7, tierColor);
  tagGrad.addColorStop(1, '#475569');
  ctx.fillStyle = tagGrad;
  ctx.fillText(tagText, W / 2, tagY);

  // === BOTTOM BAR — centered ===
  const barY = H - 55;
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, barY - 18);
  ctx.lineTo(W - 200, barY - 18);
  ctx.stroke();

  // Measure total footer width: logo + "kubemap.app" + separator + URL
  ctx.font = '800 15px "DM Sans", sans-serif';
  const brandKW = ctx.measureText('kubemap').width;
  ctx.font = '500 15px "DM Sans", sans-serif';
  const brandDotW = ctx.measureText('.app').width;
  ctx.font = '500 12px "JetBrains Mono", monospace';
  const urlText = `kubemap.app/k/${person.id}`;
  const urlW = ctx.measureText(urlText).width;
  const logoW = 16; // pin icon width
  const sepGap = 28;
  const totalFooterW = logoW + 4 + brandKW + brandDotW + sepGap + urlW;
  const footerStartX = (W - totalFooterW) / 2;

  // Logo pin
  drawLogo(ctx, footerStartX + 7, barY);

  // Brand
  const brandX = footerStartX + logoW + 8;
  ctx.font = '800 15px "DM Sans", sans-serif';
  ctx.fillStyle = '#e4e4e7';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('kubemap', brandX, barY);
  ctx.fillStyle = '#475569';
  ctx.font = '500 15px "DM Sans", sans-serif';
  ctx.fillText('.app', brandX + brandKW, barY);

  // Separator dot
  const dotX = brandX + brandKW + brandDotW + sepGap / 2;
  ctx.fillStyle = '#2a3450';
  ctx.beginPath();
  ctx.arc(dotX, barY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Profile URL
  ctx.font = '500 12px "JetBrains Mono", monospace';
  ctx.fillStyle = tierColor;
  ctx.textAlign = 'left';
  ctx.fillText(urlText, dotX + sepGap / 2, barY);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

function drawStars(ctx: CanvasRenderingContext2D, count: number) {
  for (let i = 0; i < count; i++) {
    const x = ((i * 197 + 53) % W);
    const y = ((i * 131 + 97) % H);
    const size = 0.4 + (i % 5) * 0.2;
    const alpha = 0.12 + (i % 7) * 0.05;
    ctx.fillStyle = `rgba(200,220,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGradientBorder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, colorAlpha: string) {
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.15, `${colorAlpha}0.3)`);
  grad.addColorStop(0.35, `${colorAlpha}0.6)`);
  grad.addColorStop(0.5, color);
  grad.addColorStop(0.65, `${colorAlpha}0.6)`);
  grad.addColorStop(0.85, `${colorAlpha}0.3)`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(56,189,248,0.4)';
  ctx.shadowBlur = 10;
  const grad = ctx.createLinearGradient(x - 6, y - 10, x + 6, y + 8);
  grad.addColorStop(0, '#326ce5');
  grad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y - 3, 7, Math.PI, 0);
  ctx.lineTo(x, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
