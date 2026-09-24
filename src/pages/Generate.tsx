import { useEffect, useRef, useState } from 'react';
import { IonButton, IonIcon, useIonToast } from '@ionic/react';
import {
  calendarOutline, chevronDownOutline, copyOutline, desktopOutline,
  eyeOffOutline, lockClosedOutline, personOutline,
  shareSocialOutline, sparklesOutline
} from 'ionicons/icons';

import Ticket from '../components/Ticket';
import { copyText, shareMessage } from '../lib/actions';
import { buildMessage, checkDuration, checkMid, generateActivationKey, type KeyEntry } from '../lib/keygen';

const DEFAULT_HINT = '';
function localIsoDate(daysFromNow: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export default function Generate({ onCreated }: { onCreated: (entry: KeyEntry) => void }) {
  const [mid, setMid] = useState('');
  const [client, setClient] = useState('');
  const [secret, setSecret] = useState('');
  const [expiration, setExpiration] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [current, setCurrent] = useState<KeyEntry | null>(null);
  const [nonce, setNonce] = useState(0);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [toast] = useIonToast();
  const notify = (message: string) => toast({ message, duration: 1600, position: 'top' });

  const check = checkMid(mid);
  let hint = DEFAULT_HINT;
  let hintState: 'neutral' | 'ok' | 'error' = 'neutral';
  if (submitError) { hint = submitError; hintState = 'error'; }
  else if (check.state === 'error') { hint = check.msg; hintState = 'error'; }
  else if (check.state === 'ok') { hint = check.msg; hintState = 'ok'; }
  else if (check.state === 'partial') { hint = check.msg; }

  useEffect(() => {
    if (nonce > 0) ticketRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [nonce]);

  async function submit() {
    const c = checkMid(mid);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiration + 'T00:00:00');
    const days = Math.round((expiry.getTime() - today.getTime()) / 86400000);
    if (!c.ok) {
      setSubmitError(c.state === 'empty'
        ? "Saisissez l'ID machine du client."
        : c.state === 'partial'
          ? `Il manque ${c.missing} caractère${c.missing! > 1 ? 's' : ''}.`
          : c.msg);
      return;
    }
    if (!secret.trim()) { setSubmitError('Saisissez la phrase secrète de signature.'); return; }
    if (!expiration) { setSubmitError("Choisissez une date d'expiration."); return; }
    if (!checkDuration(days)) { setSubmitError("La date d'expiration doit être comprise entre demain et 3650 jours."); return; }

    try {
      const out = await generateActivationKey(c.mid, secret, days);
      const entry: KeyEntry = { client: client.trim(), ...out };
      onCreated(entry);
      setCurrent(entry);
      setNonce((n) => n + 1);
      (document.activeElement as HTMLElement | null)?.blur();
    } catch (err) {
      setSubmitError('La génération a échoué : ' + (err as Error).message);
    }
  }

  const onEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') void submit(); };

  return (
    <>
      <div className="screen-heading">
        <h1>Générer une clé</h1>
      </div>

      <section className="generate-card">

        {/* ID Machine */}
        <div className="field">
          <label className="visual-label">ID Machine</label>
          <div className="input-wrapper">
            <IonIcon icon={desktopOutline} />
            <input
              className="visual-input mid"
              placeholder="Ex: AST-2025-001234"
              value={mid}
              maxLength={8}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              onChange={(e) => { setMid(e.target.value); setSubmitError(null); }}
              onKeyDown={onEnter}
            />
          </div>
          {(hint && hintState !== 'neutral') && (
            <p className="hint" data-state={hintState} aria-live="polite">{hint}</p>
          )}
        </div>

        {/* Phrase secrète */}
        <div className="field">
          <label className="visual-label">Phrase secrète</label>
          <div className="input-wrapper">
            <IonIcon icon={lockClosedOutline} />
            <input
              className="visual-input"
              type="text"
              placeholder="Entrez la phrase secrète"
              value={secret}
              maxLength={200}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              onChange={(e) => { setSecret(e.target.value); setSubmitError(null); }}
              onKeyDown={onEnter}
            />
            <button className="eye-btn" type="button" aria-label="Afficher/masquer">
              <IonIcon icon={eyeOffOutline} />
            </button>
          </div>
        </div>

        {/* Date d'expiration */}
        <div className="field">
          <label className="visual-label">Date d'expiration</label>
          <div className="date-select-wrapper" onClick={() => (document.getElementById('date-picker') as HTMLInputElement | null)?.showPicker?.()}>
            <IonIcon icon={calendarOutline} className="leading" />
            <span className={`date-display ${expiration ? 'date-display--set' : ''}`}>
              {expiration
                ? new Date(expiration + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Sélectionnez une date'}
            </span>
            <input
              id="date-picker"
              type="date"
              value={expiration}
              min={localIsoDate(1)}
              max={localIsoDate(3650)}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              onChange={(e) => { setExpiration(e.target.value); setSubmitError(null); }}
            />
            <IonIcon icon={chevronDownOutline} className="chevron" />
          </div>
          <p className="hint">La durée de la clé sera calculée automatiquement.</p>
        </div>

        {/* Nom du client */}
        <div className="field">
          <label className="visual-label">
            Nom du client <span>(optionnel)</span>
          </label>
          <div className="input-wrapper">
            <IonIcon icon={personOutline} />
            <input
              className="visual-input"
              placeholder="Entrez le nom du client"
              value={client}
              maxLength={60}
              enterKeyHint="go"
              onChange={(e) => setClient(e.target.value)}
              onKeyDown={onEnter}
            />
          </div>
        </div>

        {/* CTA */}
        <IonButton className="primary-action" expand="block" size="large" onClick={() => void submit()}>
          <IonIcon slot="start" icon={sparklesOutline} />
          Générer la clé
          <span slot="end" className="cta-arrow">→</span>
        </IonButton>
      </section>

      {current && (
        <section className="result" aria-label="Clé générée">
          <Ticket key={nonce} ref={ticketRef} entry={current} />
          <div className="actions">
            <IonButton className="secondary-action" expand="block"
              onClick={async () => notify((await copyText(current.key)) ? 'Clé copiée' : 'Copie impossible')}>
              <IonIcon slot="start" icon={copyOutline} />Copier la clé
            </IonButton>
            <IonButton className="secondary-action" expand="block" fill="outline"
              onClick={() => void shareMessage(buildMessage(current.key, current.client, current.exp))}>
              <IonIcon slot="start" icon={shareSocialOutline} />Envoyer au client
            </IonButton>
          </div>
          <p className="note">
            Valable jusqu'au {new Date(current.exp + 'T00:00:00Z').toLocaleDateString('fr-FR')} • {current.durationDays} jour{current.durationDays > 1 ? 's' : ''}
          </p>
        </section>
      )}
    </>
  );
}
 
