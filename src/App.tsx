import { useCallback, useEffect, useState } from 'react';
import { IonApp, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonLabel, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar, setupIonicReact, useIonAlert } from '@ionic/react';
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
  useEffect(() => { void loadHistory().then((saved) => setEntries((prev) => [...prev, ...saved.filter((s) => !prev.some((p) => sameEntry(p, s)))])); }, []);
  const addEntry = useCallback((entry: KeyEntry) => { setEntries((prev) => { const next = [entry, ...prev.filter((x) => !sameEntry(x, entry))]; void saveHistory(next); return next; }); }, []);
  const removeEntry = useCallback((entry: KeyEntry) => { setEntries((prev) => { const next = prev.filter((x) => !sameEntry(x, entry)); void saveHistory(next); return next; }); }, []);
  const askClear = () => presentAlert({ header: "Vider l'historique ?", message: 'Toutes les clés générées seront effacées de cet appareil.', buttons: [{ text: 'Annuler', role: 'cancel' }, { text: 'Vider', role: 'destructive', handler: () => { setEntries([]); void saveHistory([]); } }] });
  return <IonPage>
    <IonHeader><IonToolbar><IonTitle>{view === 'generer' ? "Clés d'activation" : 'Historique'}</IonTitle>{view === 'historique' && entries.length > 0 && <IonButtons slot="end"><IonButton color="danger" onClick={askClear}>Vider</IonButton></IonButtons>}</IonToolbar></IonHeader>
    <IonContent><div className="sheet"><div hidden={view !== 'generer'}><Generate onCreated={addEntry} /></div><div hidden={view !== 'historique'}><History entries={entries} onRemove={removeEntry} /></div></div></IonContent>
    <IonFooter><IonToolbar><IonSegment value={view} onIonChange={(e) => { const v = e.detail.value; if (v === 'generer' || v === 'historique') setView(v); }}><IonSegmentButton value="generer" layout="icon-top"><IonIcon icon={keyOutline} /><IonLabel>Générer</IonLabel></IonSegmentButton><IonSegmentButton value="historique" layout="icon-top"><IonIcon icon={timeOutline} /><IonLabel>Historique{entries.length > 0 ? ` (${entries.length})` : ''}</IonLabel></IonSegmentButton></IonSegment></IonToolbar></IonFooter>
  </IonPage>;
}
export default function App() { return <IonApp><Shell /></IonApp>; }
