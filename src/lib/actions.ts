import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { whatsappLink } from './keygen';

export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.write({ string: text });
    return true;
  } catch {
    // Repli pour un navigateur sans accès au presse-papiers (ex. http en développement)
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Ouvre la feuille de partage du téléphone (WhatsApp, SMS, e-mail…). */
export async function shareMessage(message: string): Promise<void> {
  let canShare = false;
  try {
    canShare = (await Share.canShare()).value;
  } catch {
    /* pas de partage natif */
  }
  if (canShare) {
    try {
      await Share.share({ text: message, dialogTitle: 'Envoyer la clé au client' });
    } catch {
      /* partage annulé */
    }
    return;
  }
  window.open(whatsappLink(message), '_blank', 'noopener');
}
