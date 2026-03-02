/**
 * Shipment detail card – used on tracking page and admin.
 */
import { StatusBadge } from './StatusBadge.jsx';

export function ShipmentCard({ shipment }) {
  if (!shipment) return null;

  return (
    <div
      style={{
        border: '1px solid var(--theme-dark-border)',
        borderRadius: 12,
        padding: 20,
        background: 'var(--theme-dark-card)',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-on-dark)' }}>{shipment.shipmentNumber}</h3>
          <StatusBadge status={shipment.currentStatus} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted-dark)' }}>
          Last updated: {shipment.lastUpdatedTime ? new Date(shipment.lastUpdatedTime).toLocaleString() : '—'}
        </div>
      </div>
      <dl style={{ margin: '16px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14, color: 'var(--text-on-dark)' }}>
        <dt style={{ color: 'var(--text-muted-dark)' }}>Assigned To</dt>
        <dd style={{ margin: 0 }}>{shipment.assignedTo || '—'}</dd>
        <dt style={{ color: 'var(--text-muted-dark)' }}>Pickup</dt>
        <dd style={{ margin: 0 }}>{shipment.pickupLocationName || '—'}</dd>
        <dt style={{ color: 'var(--text-muted-dark)' }}>Destination</dt>
        <dd style={{ margin: 0 }}>{shipment.destinationName || '—'}</dd>
        <dt style={{ color: 'var(--text-muted-dark)' }}>Current Location</dt>
        <dd style={{ margin: 0 }}>{shipment.currentLocationName || '—'}</dd>
        <dt style={{ color: 'var(--text-muted-dark)' }}>Transport Mode</dt>
        <dd style={{ margin: 0 }}>{shipment.transportMode || '—'}</dd>
      </dl>
    </div>
  );
}
