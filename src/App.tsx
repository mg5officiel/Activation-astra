import { useCallback, useEffect, useState } from 'react';
import {
  IonApp, IonButton, IonButtons, IonContent,
  IonHeader, IonIcon, IonPage,
  IonToolbar, setupIonicReact, useIonAlert
} from '@ionic/react';
import { keyOutline, personOutline, timeOutline } from 'ionicons/icons';
import Generate from './pages/Generate';
import History from './pages/History';
import { loadHistory, saveHistory } from './lib/history';
import type { KeyEntry } from './lib/keygen';

setupIonicReact({ mode: 'md' });
type View = 'generer' | 'historique';
const sameEntry = (a: KeyEntry, b: KeyEntry) => a.mid === b.mid && a.iat === b.iat && a.exp === b.exp;

function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const threshold = 120; // px de réduction de hauteur = clavier probablement ouvert
    const baseline = window.innerHeight;
    const onResize = () => setOpen(baseline - vv.height > threshold);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);
  return open;
}

function Shell() {
  const [view, setView] = useState<View>('generer');
  const [entries, setEntries] = useState<KeyEntry[]>([]);
  const [presentAlert] = useIonAlert();
  const keyboardOpen = useKeyboardOpen();

  useEffect(() => {
    void loadHistory().then((saved) =>
      setEntries((prev) => [...prev, ...saved.filter((s) => !prev.some((p) => sameEntry(p, s)))])
    );
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
    header: 'Vider l\u2019historique\u00a0?',
    message: 'Toutes les clés générées seront effacées de cet appareil.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Vider', role: 'destructive', handler: () => { setEntries([]); void saveHistory([]); } }
    ]
  });

  return (
    <IonPage>
      {/* ── Header ── */}
      <IonHeader className="app-header">
        <IonToolbar>
          <div className="brand" slot="start">
            <div className="brand-logo">
              <img src="/astra-logo.svg" alt="Astra Key" />
            </div>
            <div>
              <span className="brand-name">Astra Key</span>
              <span className="brand-subtitle">Activation sécurisée</span>
            </div>
          </div>
          <IonButtons slot="end">
            {view === 'historique' && entries.length > 0 ? (
              <IonButton className="clear-button" fill="clear" onClick={askClear}>Vider</IonButton>
            ) : (
              <IonButton className="profile-button" fill="clear" aria-label="Profil">
                <IonIcon icon={personOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* ── Content ── */}
      <IonContent fullscreen>
        <div className="sheet">
          <div hidden={view !== 'generer'}><Generate onCreated={addEntry} /></div>
          <div hidden={view !== 'historique'}><History entries={entries} onRemove={removeEntry} /></div>
        </div>

        {/* Watermark logo bas-droite */}
        <img
          src="/astra-logo.svg"
          className="astra-watermark"
          aria-hidden="true"
          alt=""
        />
      </IonContent>

      {/* ── Tab bar ── */}
      {!keyboardOpen && (
        <footer className="glass-footer">
          <div className="tab-pill" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'generer'}
              aria-label="Générer"
              className={`tab-btn ${view === 'generer' ? 'tab-btn--active' : ''}`}
              onClick={() => setView('generer')}
            >
              <IonIcon icon={keyOutline} />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'historique'}
              aria-label="Historique"
              className={`tab-btn ${view === 'historique' ? 'tab-btn--active' : ''}`}
              onClick={() => setView('historique')}
            >
              <IonIcon icon={timeOutline} />
            </button>
          </div>
        </footer>
      )}
    </IonPage>
  );
}

export default function App() { return <IonApp><Shell /></IonApp>; }
 
