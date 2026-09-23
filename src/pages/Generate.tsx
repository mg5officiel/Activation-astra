import { useEffect, useRef, useState } from 'react';
import { IonButton, IonIcon, IonInput, useIonToast } from '@ionic/react';
import { calendarOutline, copyOutline, desktopOutline, flashOutline, lockClosedOutline, personOutline, shareSocialOutline, shieldCheckmarkOutline, sparklesOutline } from 'ionicons/icons';

import Ticket from '../components/Ticket';
import { copyText, shareMessage } from '../lib/actions';
import { buildMessage, checkDuration, checkMid, generateActivationKey, type KeyEntry } from '../lib/keygen';

const DEFAULT_HINT = '8 caractères : chiffres 0–9 et lettres a–f.';
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
  const [expiration, setExpiration] = useState(localIsoDate(30));
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
        ? "Saisissez l'ID machine du client : 8 caractères, par exemple a3f7c291."
        : c.state === 'partial'
          ? `Il manque ${c.missing} caractère${c.missing! > 1 ? 's' : ''} : l'ID machine en compte 8.`
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
        <span className="eyebrow">NOUVELLE ACTIVATION</span>
        <h1>Générer une clé</h1>
        <p>Entrez les informations ci-dessous pour générer une clé d’activation sécurisée.</p>
      </div>

      <section className="generate-card">
        <div className="field">
          <label className="visual-label"><IonIcon icon={desktopOutline} />ID Machine</label>
          <IonInput
            className="visual-input mid"
            fill="outline"
            placeholder="Ex : a3f7c291"
            value={mid}
            maxlength={8}
            autocapitalize="off"
            autocorrect={false}
            spellcheck={false}
            enterkeyhint="next"
            onIonInput={(e) => { setMid(String(e.detail.value ?? '')); setSubmitError(null); }}
            onKeyDown={onEnter}
          />
          <p className="hint" data-state={hintState} aria-live="polite">{hint}</p>
        </div>

        <div className="field">
          <label className="visual-label"><IonIcon icon={lockClosedOutline} />Phrase secrète</label>
          <IonInput
            className="visual-input"
            type="password"
            fill="outline"
            placeholder="Entrez votre phrase secrète"
            value={secret}
            maxlength={200}
            autocapitalize="off"
            autocorrect={false}
            spellcheck={false}
            enterkeyhint="next"
            onIonInput={(e) => { setSecret(String(e.detail.value ?? '')); setSubmitError(null); }}
            onKeyDown={onEnter}
          />
          <p className="hint">Utilisée pour signer la clé. Elle n'est jamais enregistrée.</p>
        </div>

        <div className="field">
          <label className="visual-label"><IonIcon icon={calendarOutline} />Date d'expiration</label>
          <IonInput
            className="visual-input"
            type="date"
            fill="outline"
            value={expiration}
            min={localIsoDate(1)}
            max={localIsoDate(3650)}
            enterkeyhint="next"
            onIonInput={(e) => { setExpiration(String(e.detail.value ?? '')); setSubmitError(null); }}
            onKeyDown={onEnter}
          />
          <p className="hint">La durée de validité est calculée automatiquement.</p>
        </div>

        <div className="field">
          <label className="visual-label"><IonIcon icon={personOutline} />Nom du client <span>(facultatif)</span></label>
          <IonInput
            className="visual-input"
            fill="outline"
            placeholder="Entrez le nom du client"
            value={client}
            maxlength={60}
            enterkeyhint="go"
            onIonInput={(e) => setClient(String(e.detail.value ?? ''))}
            onKeyDown={onEnter}
          />
          <p className="hint">Apparaît dans l'historique et le message envoyé.</p>
        </div>

        <IonButton className="primary-action" expand="block" size="large" onClick={() => void submit()}>
          <IonIcon slot="start" icon={sparklesOutline} />
          Générer la clé
          <IonIcon slot="end" icon={shareSocialOutline} style={{visibility:'hidden'}} />
        </IonButton>

        <div className="feature-strip" aria-label="Avantages">
          <div><IonIcon icon={shieldCheckmarkOutline}/><span>Sécurisé</span></div>
          <div><IonIcon icon={flashOutline}/><span>Rapide</span></div>
          <div><IonIcon icon={lockClosedOutline}/><span>Fiable</span></div>
        </div>
      </section>

      {current && (
        <section className="result" aria-label="Clé générée">
          <Ticket key={nonce} ref={ticketRef} entry={current} />
          <div className="actions">
            <IonButton className="secondary-action" expand="block" onClick={async () => notify((await copyText(current.key)) ? 'Clé copiée' : 'Copie impossible')}>
              <IonIcon slot="start" icon={copyOutline} />Copier la clé
            </IonButton>
            <IonButton className="secondary-action" expand="block" fill="outline" onClick={() => void shareMessage(buildMessage(current.key, current.client, current.exp))}>
              <IonIcon slot="start" icon={shareSocialOutline} />Envoyer au client
            </IonButton>
          </div>
          <p className="note">Valable jusqu'au {new Date(current.exp + 'T00:00:00Z').toLocaleDateString('fr-FR')} • {current.durationDays} jour{current.durationDays > 1 ? 's' : ''}</p>
        </section>
      )}
 
    </>
  );
}
