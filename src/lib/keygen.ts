/**
 * Équivalent de votre generate.ts : même algorithme, mêmes clés.
 * (La ligne de commande, elle, n'est pas reprise : c'est l'interface qui la remplace.)
 */
import { hmacSign } from './crypto';

const CHARS = 'BCDFGHJKMNPQRTVWXY2346789';

export interface KeyEntry {
  client: string;
  mid: string; // ID machine (8 hex)
  iat: string; // date d'émission YYYY-MM-DD (UTC)
  key: string; // clé d'activation
}

export type MidCheck =
  | { ok: true; state: 'ok'; mid: string; msg: string }
  | { ok: false; state: 'empty' | 'partial' | 'error'; msg: string; missing?: number };

function toBase25(hex: string, length: number): string {
  let num = BigInt('0x' + hex);
  let result = '';
  for (let i = 0; i < length; i++) {
    result = CHARS[Number(num % BigInt(CHARS.length))] + result;
    num /= BigInt(CHARS.length);
  }
  return result.padStart(length, CHARS[0]);
}

function formatKey(flat: string): string {
  return flat.match(/.{5}/g)!.join('-');
}

/** Même règle que generate.ts : 8 caractères hexadécimaux, sans tenir compte de la casse. */
export function checkMid(raw: string): MidCheck {
  const mid = raw.trim().toLowerCase();
  if (!mid) return { ok: false, state: 'empty', msg: '' };
  if (/[^a-f0-9]/.test(mid)) {
    return { ok: false, state: 'error', msg: 'Caractère non valide : seuls les chiffres 0–9 et les lettres a–f sont acceptés.' };
  }
  if (mid.length < 8) return { ok: false, state: 'partial', msg: `${mid.length} sur 8 caractères`, missing: 8 - mid.length };
  if (mid.length > 8) return { ok: false, state: 'error', msg: `${mid.length} caractères saisis : l'ID machine en compte 8.` };
  return { ok: true, state: 'ok', mid, msg: 'ID valide' };
}

export async function generateActivationKey(
  machineId: string,
  now: Date = new Date(),
  forceFallback = false,
): Promise<Pick<KeyEntry, 'key' | 'mid' | 'iat'>> {
  const check = checkMid(machineId);
  if (!check.ok) {
    throw new Error(`ID Machine invalide : « ${machineId.trim().toLowerCase()} »\nAttendu : 8 caractères hex (ex: a3f7c291)`);
  }
  const mid = check.mid;
  const iat = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const dataToSign = `v=1|mid=${mid}|iat=${iat}`;
  const sig = await hmacSign(dataToSign, forceFallback);

  const payload = mid + iat.replace(/-/g, '') + sig.slice(0, 8);
  return { key: formatKey(toBase25(payload, 25)), mid, iat };
}

/* ── Présentation ─────────────────────────────────────────────────────── */

export function formatDate(iat: string, month: 'long' | 'short' = 'long'): string {
  return new Date(iat + 'T00:00:00Z').toLocaleDateString('fr-FR', {
    timeZone: 'UTC',
    day: 'numeric',
    month,
    year: 'numeric',
  });
}

export function buildMessage(key: string, client: string): string {
  const hello = client ? `Bonjour ${client},` : 'Bonjour,';
  return `${hello}\n\nVoici votre clé d'activation Gestion Cyber :\n\n${key}\n\nMerci de la saisir dans l'application pour l'activer.`;
}

export const whatsappLink = (message: string): string =>
  'https://wa.me/?text=' + encodeURIComponent(message);
