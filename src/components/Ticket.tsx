import { forwardRef } from 'react';
import { formatDate, type KeyEntry } from '../lib/keygen';

const Ticket = forwardRef<HTMLDivElement, { entry: KeyEntry }>(({ entry }, ref) => (
  <div className="ticket-wrap" ref={ref}>
    <div className="ticket print">
      <div className="ticket-topline" />
      <div className="ticket-brand">
        <div className="ticket-brand-mark"><img src="/astra-logo.svg" alt="" /></div>
        <div>
          <span className="ticket-kicker">ASTRA KEY</span>
          <strong>Clé d’activation</strong>
        </div>
        <span className="ticket-status"><i /> Active</span>
      </div>

      <div className="ticket-client">
        <span>CLIENT</span>
        <strong>{entry.client || 'Activation sans nom'}</strong>
      </div>

      <div className="ticket-key-label">Votre clé</div>
      <div className="key-shell">
        <p className="key" aria-label={`Clé d'activation : ${entry.key}`}>
          {entry.key.split('-').map((group, i) => <span className="g" key={i}>{group}</span>)}
        </p>
      </div>

      <div className="ticket-meta">
        <div><span>ID machine</span><b>{entry.mid}</b></div>
        <div><span>Validité</span><b>{entry.durationDays} jour{entry.durationDays > 1 ? 's' : ''}</b></div>
        <div><span>Expiration</span><b>{formatDate(entry.exp, 'short')}</b></div>
      </div>

      <div className="ticket-foot">
        <span>Générée le {formatDate(entry.iat, 'short')}</span>
        <span>Activation sécurisée</span>
      </div>
    </div>
  </div>
));

export default Ticket;
