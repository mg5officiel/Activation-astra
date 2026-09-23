import { useEffect, useRef, useState } from 'react';
import { IonButton, IonIcon, IonInput, useIonToast } from '@ionic/react';
import { copyOutline, shareSocialOutline } from 'ionicons/icons';

import Ticket from '../components/Ticket';
import { copyText, shareMessage } from '../lib/actions';
import { buildMessage, checkDuration, checkMid, generateActivationKey, type KeyEntry } from '../lib/keygen';

const DEFAULT_HINT = '8 caractères : chiffres 0–9 et lettres a–f.';

export default function Generate({ onCreated }: { onCreated: (entry: KeyEntry) => void }) {
  const [mid, setMid] = useState('');
  const [client, setClient] = useState('');
  const [secret, setSecret] = useState('');
  const [duration, setDuration] = useState('30');
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
    const days = Number(duration);
    if (!c.ok) {
      setSubmitError(c.state === 'empty'
        ? "Saisissez l'ID machine du client : 8 caractères, par exemple a3f7c291."
        : c.state === 'partial'
          ? `Il manque ${c.missing} caractère${c.missing! > 1 ? 's' : ''} : l'ID machine en compte 8.`
          : c.msg);
      return;
    }
    if (!secret.trim()) { setSubmitError('Saisissez la phrase secrète de signature.'); return; }
    if (!checkDuration(days)) { setSubmitError('La durée doit être un nombre entier compris entre 1 et 3650 jours.'); return; }

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
        <p>Créez une clé d’activation en quelques secondes.</p>
      </div>

      <div className="field">
        <IonInput
          className="mid"
          label="ID machine"
          labelPlacement="stacked"
          fill="outline"
          placeholder="a3f7c291"
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
        <IonInput
          type="password"
          label="Phrase secrète"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Votre phrase secrète de signature"
          value={secret}
          maxlength={200}
          autocapitalize="off"
          autocorrect={false}
          spellcheck={false}
          enterkeyhint="next"
          onIonInput={(e) => { setSecret(String(e.detail.value ?? '')); setSubmitError(null); }}
          onKeyDown={onEnter}
        />
        <p className="hint">Elle sert directement à signer la clé. Elle n'est pas enregistrée dans l'historique.</p>
      </div>

      <div className="field">
        <IonInput
          type="number"
          label="Durée de validité (jours)"
          labelPlacement="stacked"
          fill="outline"
          placeholder="30"
          value={duration}
          min="1"
          max="3650"
          inputmode="numeric"
          enterkeyhint="next"
          onIonInput={(e) => { setDuration(String(e.detail.value ?? '')); setSubmitError(null); }}
          onKeyDown={onEnter}
        />
        <p className="hint">Exemple : 30 = valable 30 jours à partir de la génération.</p>
      </div>

      <div className="field">
        <IonInput
          label="Nom du client (facultatif)"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Ex. Cyber Baobab"
          value={client}
          maxlength={60}
          enterkeyhint="go"
          onIonInput={(e) => setClient(String(e.detail.value ?? ''))}
          onKeyDown={onEnter}
        />
        <p className="hint">Apparaît dans le message envoyé et dans l'historique.</p>
      </div>

      <IonButton expand="block" size="large" onClick={() => void submit()}>
        Générer la clé
      </IonButton>

      {current && (
        <section className="result" aria-label="Clé générée">
          <Ticket key={nonce} ref={ticketRef} entry={current} />
          <div className="actions">
            <IonButton expand="block" onClick={async () => notify((await copyText(current.key)) ? 'Clé copiée' : 'Copie impossible')}>
              <IonIcon slot="start" icon={copyOutline} />Copier la clé
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={() => void shareMessage(buildMessage(current.key, current.client, current.exp))}>
              <IonIcon slot="start" icon={shareSocialOutline} />Envoyer au client
            </IonButton>
          </div>
          <p className="note">Valable jusqu'au {new Date(current.exp + 'T00:00:00Z').toLocaleDateString('fr-FR')} • {current.durationDays} jour{current.durationDays > 1 ? 's' : ''}</p>
        </section>
      )}

      <p className="warn">La phrase secrète n'est pas enregistrée. Ne partagez pas cette application ni votre phrase secrète.</p>
    </>
  );
}
