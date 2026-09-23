import { forwardRef } from 'react';
import { formatDate, type KeyEntry } from '../lib/keygen';

const Ticket = forwardRef<HTMLDivElement, { entry: KeyEntry }>(({ entry }, ref) => (
  <div className="ticket-wrap" ref={ref}>
    <div className="ticket print">
      <div className="ticket-head">
        <span>Machine <b>{entry.mid}</b></span>
        <span>Expire le {formatDate(entry.exp, 'short')}</span>
      </div>
      <div className="ticket-body">
        <p className="key" aria-label={`Clé d'activation : ${entry.key}`}>
          {entry.key.split('-').map((group, i) => <span className="g" key={i}>{group}</span>)}
        </p>
      </div>
    </div>
  </div>
));

export default Ticket;
