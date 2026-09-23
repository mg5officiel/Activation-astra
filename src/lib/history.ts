import { Preferences } from '@capacitor/preferences';
import type { KeyEntry } from './keygen';

const STORE_KEY = 'gestion-cyber-keygen:history';
const MAX_ENTRIES = 200;

export async function loadHistory(): Promise<KeyEntry[]> {
  try {
    const { value } = await Preferences.get({ key: STORE_KEY });
    const list = value ? JSON.parse(value) : [];
    if (!Array.isArray(list)) return [];
    return list
      .filter((e) => e && typeof e.mid === 'string' && typeof e.iat === 'string' && typeof e.key === 'string')
      .map((e) => ({ ...e, exp: typeof e.exp === 'string' ? e.exp : e.iat, durationDays: Number.isInteger(e.durationDays) ? e.durationDays : 0 }));
  } catch { return []; }
}

export async function saveHistory(list: KeyEntry[]): Promise<void> {
  try { await Preferences.set({ key: STORE_KEY, value: JSON.stringify(list.slice(0, MAX_ENTRIES)) }); }
  catch { /* l'historique reste en mémoire pour cette session */ }
}
