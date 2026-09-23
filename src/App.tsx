import { useCallback, useEffect, useState } from 'react';
import { IonApp, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonPage, IonSegment, IonSegmentButton, IonToolbar, setupIonicReact, useIonAlert } from '@ionic/react';
import { keyOutline, timeOutline } from 'ionicons/icons';
import Generate from './pages/Generate';
import History from './pages/History';
import { loadHistory, saveHistory } from './lib/history';
import type { KeyEntry } from './lib/keygen';

setupIonicReact({ mode: 'md' });
type View = 'generer' | 'historique';
const sameEntry = (a: KeyEntry, b: KeyEntry) => a.mid === b.mid && a.iat === b.iat && a.exp === b.exp;

function Shell() {
  const [view, setView] = useState<View>('generer');
  const [entries, setEntries] = useState<KeyEntry[]>([]);
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    void loadHistory().then((saved) => setEntries((prev) => [...prev, ...saved.filter((s) => !prev.some((p) => sameEntry(p, s)))]));
  }, []);

  const addEntry = useCallback((entry: KeyEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev.filter((x) => !sameEntry(x, entry))];
      void saveHistory(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((entry: KeyEntry) => {
    setEntries((prev) => {
      const next = prev.filter((x) => !sameEntry(x, entry));
      void saveHistory(next);
      return next;
    });
  }, []);

  const askClear = () => presentAlert({
    header: 'Vider l’historique ?',
    message: 'Toutes les clés générées seront effacées de cet appareil.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Vider', role: 'destructive', handler: () => { setEntries([]); void saveHistory([]); } }
    ]
  });

  return <IonPage>
    <IonHeader className="app-header">
      <IonToolbar>
        <div className="brand" slot="start">
          <div className="brand-logo"><img src="/astra-logo.svg" alt="Astra Key" /></div>
          <div><span className="brand-name">Astra Key</span><span className="brand-subtitle">Activation sécurisée</span></div>
        </div>
        {view === 'historique' && entries.length > 0 && (
          <IonButtons slot="end">
            <IonButton className="clear-button" fill="clear" onClick={askClear}>Vider</IonButton>
          </IonButtons>
        )}
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <div className="sheet">
        <div hidden={view !== 'generer'}><Generate onCreated={addEntry} /></div>
        <div hidden={view !== 'historique'}><History entries={entries} onRemove={removeEntry} /></div>
      </div>
    </IonContent>

    <IonFooter className="glass-footer">
      <IonToolbar>
        <IonSegment value={view} onIonChange={(e) => {
          const v = e.detail.value;
          if (v === 'generer' || v === 'historique') setView(v);
        }}>
          <IonSegmentButton value="generer" aria-label="Générer">
            <IonIcon icon={keyOutline} />
          </IonSegmentButton>
          <IonSegmentButton value="historique" aria-label="Historique">
            <IonIcon icon={timeOutline} />
          </IonSegmentButton>
        </IonSegment>
      </IonToolbar>
    </IonFooter>
  </IonPage>;
}

export default function App() { return <IonApp><Shell /></IonApp>; }
