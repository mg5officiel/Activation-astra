import { hmacSign } from './crypto';

const CHARS = 'BCDFGHJKMNPQRTVWXY2346789';

export interface KeyEntry {
  client: string;
  mid: string;
  iat: string;
  exp: string;
  durationDays: number;
  key: string;
}

export type MidCheck =
  | { ok: true; state: 'ok'; mid: string; msg: string }
  | { ok: false; state: 'empty' | 'partial' | 'error'; msg: string; missing?: number };

function toBase25(hex: string, length: number): string {
  let num = BigInt('0x' + hex); let result = '';
  for (let i = 0; i < length; i++) { result = CHARS[Number(num % BigInt(CHARS.length))] + result; num /= BigInt(CHARS.length); }
  return result.padStart(length, CHARS[0]);
}
function formatKey(flat: string): string { return flat.match(/.{5}/g)!.join('-'); }

export function checkMid(raw: string): MidCheck {
  const mid = raw.trim().toLowerCase();
  if (!mid) return { ok: false, state: 'empty', msg: '' };
  if (/[^a-f0-9]/.test(mid)) return { ok: false, state: 'error', msg: 'Caractère non valide : seuls les chiffres 0–9 et les lettres a–f sont acceptés.' };
  if (mid.length < 8) return { ok: false, state: 'partial', msg: `${mid.length} sur 8 caractères`, missing: 8 - mid.length };
  if (mid.length > 8) return { ok: false, state: 'error', msg: `${mid.length} caractères saisis : l'ID machine en compte 8.` };
  return { ok: true, state: 'ok', mid, msg: 'ID valide' };
}

export function checkDuration(raw: number): boolean {
  return Number.isInteger(raw) && raw >= 1 && raw <= 3650;
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date.getTime()); out.setUTCDate(out.getUTCDate() + days); return out;
}
function isoDate(date: Date): string { return date.toISOString().split('T')[0]; }

/**
 * Format v2 : mid(8 hex) + expiration(8 hex YYYYMMDD) + signature(8 hex).
 * La date d'expiration est donc présente dans la charge utile et protégée par HMAC.
 */
export async function generateActivationKey(
  machineId: string,
  secret: string,
  durationDays: number,
  now: Date = new Date(),
  forceFallback = false,
): Promise<Pick<KeyEntry, 'key' | 'mid' | 'iat' | 'exp' | 'durationDays'>> {
  const check = checkMid(machineId);
  if (!check.ok) throw new Error(`ID Machine invalide : « ${machineId.trim().toLowerCase()} »\nAttendu : 8 caractères hex (ex: a3f7c291)`);
  if (!secret.trim()) throw new Error('La phrase secrète est obligatoire.');
  if (!checkDuration(durationDays)) throw new Error('La durée doit être un nombre entier de 1 à 3650 jours.');

  const mid = check.mid;
  const iat = isoDate(now);
  const exp = isoDate(addDays(now, durationDays));
  const expCompact = exp.replace(/-/g, '');
  const dataToSign = `v=2|mid=${mid}|iat=${iat}|exp=${exp}`;
  const sig = await hmacSign(dataToSign, secret, forceFallback);
  const payload = mid + expCompact + sig.slice(0, 8);
  return { key: formatKey(toBase25(payload, 25)), mid, iat, exp, durationDays };
}

export function formatDate(date: string, month: 'long' | 'short' = 'long'): string {
  return new Date(date + 'T00:00:00Z').toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month, year: 'numeric' });
}

export function buildMessage(key: string, client: string, exp?: string): string {
  const hello = client ? `Bonjour ${client},` : 'Bonjour,';
  const validity = exp ? `\n\nValable jusqu'au ${formatDate(exp, 'long')}.` : '';
  return `${hello}\n\nVoici votre clé d'activation Astra Key :\n\n${key}${validity}\n\nMerci de la saisir dans l'application pour l'activer.`;
}

export const whatsappLink = (message: string): string => 'https://wa.me/?text=' + encodeURIComponent(message);
