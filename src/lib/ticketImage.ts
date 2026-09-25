import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toJpeg } from 'html-to-image';
import type { KeyEntry } from './keygen';

function CapacitorLikeNative(): boolean {
  return typeof window !== 'undefined' && !!(window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] ?? '';
}

/**
 * Rasterise EXACTEMENT le ticket tel qu'affiché à l'écran (même DOM, même CSS)
 * plutôt que de le redessiner séparément — garantit que le JPG obtenu est
 * identique au ticket visible dans l'application.
 */
async function renderTicketAsJpeg(el: HTMLElement): Promise<string> {
  return toJpeg(el, {
    quality: 0.95,
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });
}

function filenameFor(entry: KeyEntry): string {
  return 'astra-key-' + entry.mid.toUpperCase() + '-' + Date.now() + '.jpg';
}

export async function saveTicketJpg(el: HTMLElement, entry: KeyEntry): Promise<string> {
  const dataUrl = await renderTicketAsJpeg(el);
  const filename = filenameFor(entry);

  if (CapacitorLikeNative()) {
    const result = await Filesystem.writeFile({
      path: filename,
      data: dataUrlToBase64(dataUrl),
      directory: Directory.Documents,
      recursive: true,
    });
    return result.uri;
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
  return filename;
}

export async function shareTicketJpg(el: HTMLElement, entry: KeyEntry): Promise<void> {
  const dataUrl = await renderTicketAsJpeg(el);
  const filename = filenameFor(entry);

  if (CapacitorLikeNative()) {
    const result = await Filesystem.writeFile({
      path: filename,
      data: dataUrlToBase64(dataUrl),
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      files: [result.uri],
      dialogTitle: 'Partager la clé Astra Key',
    });
    return;
  }

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/jpeg' });
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], title: 'Astra Key' });
  } else {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}
 
