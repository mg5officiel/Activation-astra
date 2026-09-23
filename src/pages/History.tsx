import { IonButton, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonList, useIonToast } from '@ionic/react';
import { copyOutline, shareSocialOutline } from 'ionicons/icons';

import { copyText, shareMessage } from '../lib/actions';
import { buildMessage, formatDate, type KeyEntry } from '../lib/keygen';

interface Props { entries: KeyEntry[]; onRemove: (entry: KeyEntry) => void; }

export default function History({ entries, onRemove }: Props) {
  const [toast] = useIonToast();
  if (entries.length === 0) return <p className="empty-state">Aucune clé pour l'instant. Générez la première depuis l'onglet Générer.</p>;

  return (
    <>
      <div className="screen-heading">
        <span className="eyebrow">ARCHIVES</span>
        <h1>Historique</h1>
        <p>Retrouvez rapidement vos clés déjà générées.</p>
      </div>
      <IonList lines="none" className="h-list">
        {entries.map((e) => (
          <IonItemSliding key={e.mid + e.iat + e.exp}>
            <IonItem lines="full" className="h-item">
              <div className="h-body">
                <div className="h-top">
                  <span className={e.client ? 'h-client' : 'h-client empty'}>{e.client || 'Sans nom'}</span>
                  <span className="h-date">Expire le {formatDate(e.exp, 'short')}</span>
                </div>
                <div className="h-key">{e.key}</div>
                <div className="h-mid">Machine <code>{e.mid}</code> • {e.durationDays} jour{e.durationDays > 1 ? 's' : ''}</div>
                <div className="h-actions">
                  <IonButton size="small" fill="outline" onClick={async () => toast({ message: (await copyText(e.key)) ? 'Clé copiée' : 'Copie impossible', duration: 1600, position: 'top' })}>
                    <IonIcon slot="start" icon={copyOutline} />Copier
                  </IonButton>
                  <IonButton size="small" fill="outline" onClick={() => void shareMessage(buildMessage(e.key, e.client, e.exp))}>
                    <IonIcon slot="start" icon={shareSocialOutline} />Envoyer
                  </IonButton>
                </div>
              </div>
            </IonItem>
            <IonItemOptions side="end"><IonItemOption color="danger" onClick={() => onRemove(e)}>Retirer</IonItemOption></IonItemOptions>
          </IonItemSliding>
        ))}
      </IonList>
    </>
  );
}
