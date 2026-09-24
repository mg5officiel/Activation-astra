import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { KeyEntry } from './keygen';
import { formatDate } from './keygen';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, x, y, size, size); resolve(); };
    img.onerror = () => resolve();
    img.src = '/astra-logo.svg';
  });
}

export async function createTicketJpg(entry: KeyEntry): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');

  // Le JPG reprend la carte blanche arrondie visible dans le ticket résultat.
  // Les marges extérieures restent blanches pour conserver les coins arrondis sur un format JPG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const x = 34, y = 34, w = 1012, h = 1282;
  ctx.save();
  ctx.shadowColor = 'rgba(20,35,65,.12)';
  ctx.shadowBlur = 38;
  ctx.shadowOffsetY = 14;
  roundedRect(ctx, x, y, w, h, 48);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, x, y, w, h, 48);
  ctx.clip();
  ctx.fillStyle = '#4b7ff6';
  ctx.fillRect(x, y, w, 12);
  ctx.restore();

  await drawLogo(ctx, x + 54, y + 45, 76);

  ctx.fillStyle = '#14213d';
  ctx.font = '800 30px Arial, sans-serif';
  ctx.fillText('ASTRA KEY', x + 148, y + 76);
  ctx.fillStyle = '#71809a';
  ctx.font = '500 22px Arial, sans-serif';
  ctx.fillText('Clé d’activation', x + 148, y + 108);

  ctx.fillStyle = '#eef7f0';
  roundedRect(ctx, x + w - 190, y + 48, 130, 42, 21);
  ctx.fill();
  ctx.fillStyle = '#16834b';
  ctx.font = '700 20px Arial, sans-serif';
  ctx.fillText('●  Active', x + w - 172, y + 76);

  ctx.fillStyle = '#98a2b3';
  ctx.font = '800 18px Arial, sans-serif';
  ctx.fillText('CLIENT', x + 55, y + 200);
  ctx.fillStyle = '#17233e';
  ctx.font = '800 29px Arial, sans-serif';
  const clientLines = wrapText(ctx, entry.client || 'Activation sans nom', 820);
  clientLines.forEach((line, i) => ctx.fillText(line, x + 55, y + 244 + i * 38));

  const keyY = y + 335;
  ctx.fillStyle = '#f5f8ff';
  roundedRect(ctx, x + 55, keyY, w - 110, 190, 24);
  ctx.fill();
  ctx.fillStyle = '#6b7d9c';
  ctx.font = '700 19px Arial, sans-serif';
  ctx.fillText('VOTRE CLÉ D’ACTIVATION', x + 82, keyY + 48);
  ctx.fillStyle = '#14213d';
  ctx.font = '800 34px Courier New, monospace';
  const keyLines = wrapText(ctx, entry.key, w - 170);
  keyLines.forEach((line, i) => ctx.fillText(line, x + 82, keyY + 104 + i * 48));

  const metaY = y + 580;
  const colW = (w - 110) / 3;
  const metas = [
    ['ID MACHINE', entry.mid],
    ['VALIDITÉ', entry.durationDays + ' jour' + (entry.durationDays > 1 ? 's' : '')],
    ['EXPIRATION', formatDate(entry.exp, 'short')]
  ];
  metas.forEach(([label, value], i) => {
    const mx = x + 55 + i * colW;
    ctx.fillStyle = '#98a2b3';
    ctx.font = '700 16px Arial, sans-serif';
    ctx.fillText(label, mx, metaY);
    ctx.fillStyle = '#344054';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.fillText(value, mx, metaY + 38);
  });

  ctx.strokeStyle = '#e8edf3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 55, y + 720);
  ctx.lineTo(x + w - 55, y + 720);
  ctx.stroke();

  ctx.fillStyle = '#667085';
  ctx.font = '500 18px Arial, sans-serif';
  ctx.fillText('Générée le ' + formatDate(entry.iat, 'short'), x + 55, y + 765);
  ctx.textAlign = 'right';
  ctx.fillText('Activation sécurisée', x + w - 55, y + 765);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/jpeg', 0.94);
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] ?? '';
}

export async function saveTicketJpg(entry: KeyEntry): Promise<string> {
  const dataUrl = await createTicketJpg(entry);
  const filename = 'astra-key-' + entry.mid.toUpperCase() + '-' + Date.now() + '.jpg';

  if (CapacitorLikeNative()) {
    const result = await Filesystem.writeFile({
      path: filename,
      data: dataUrlToBase64(dataUrl),
      directory: Directory.Documents,
      recursive: true
    });
    return result.uri;
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
  return filename;
}

export async function shareTicketJpg(entry: KeyEntry): Promise<void> {
  const dataUrl = await createTicketJpg(entry);
  const filename = 'astra-key-' + entry.mid.toUpperCase() + '-' + Date.now() + '.jpg';

  if (CapacitorLikeNative()) {
    const result = await Filesystem.writeFile({
      path: filename,
      data: dataUrlToBase64(dataUrl),
      directory: Directory.Cache,
      recursive: true
    });
    await Share.share({
      files: [result.uri],
      dialogTitle: 'Partager la clé Astra Key'
    });
    return;
  }

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/jpeg' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Astra Key' });
  } else {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}

function CapacitorLikeNative(): boolean {
  return typeof window !== 'undefined' && !!(window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}
