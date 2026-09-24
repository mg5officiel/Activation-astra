import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import Ticket from './Ticket';
import type { KeyEntry } from '../lib/keygen';

type TicketModalProps = {
  isOpen: boolean;
  entry: KeyEntry | null;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function TicketModal({ isOpen, entry, onClose, children }: TicketModalProps) {
  if (!isOpen || !entry) return null;

  return (
    <div className="ticket-modal" role="dialog" aria-modal="true" aria-label="Ticket de clé générée">
      <button className="ticket-modal-backdrop" type="button" aria-label="Fermer" onClick={onClose} />
      <div className="ticket-modal-panel">
        <div className="ticket-modal-header">
          <div>
            <span className="ticket-modal-kicker">ACTIVATION TERMINÉE</span>
            <h2>Ticket de résultat</h2>
          </div>
          <button className="ticket-modal-close" type="button" aria-label="Fermer" onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        <div className="ticket-modal-content">
          <Ticket entry={entry} />
          {children}
        </div>
      </div>
    </div>
  );
}
