/**
 * Status badge – shows current status with consistent styling.
 */
export function StatusBadge({ status }) {
  const statusColors = {
    Created: '#94a3b8',
    'Picked Up': '#3b82f6',
    Dispatched: '#8b5cf6',
    'In Transit': '#f59e0b',
    'Out for Delivery': '#f97316',
    Delivered: '#22c55e',
  };
  const color = statusColors[status] || '#64748b';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        background: color,
        color: '#fff',
      }}
    >
      {status || '—'}
    </span>
  );
}
