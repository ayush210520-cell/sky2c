/**
 * Allowed shipment statuses in order (for validation and email triggers).
 */
export const STATUS_FLOW = [
  'Created',
  'Picked Up',
  'Dispatched',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

export function isValidStatus(status) {
  return STATUS_FLOW.includes(status);
}

export function getStatusIndex(status) {
  return STATUS_FLOW.indexOf(status);
}

/** Statuses that trigger an automatic email to the customer */
export const EMAIL_TRIGGER_STATUSES = [
  'Picked Up',
  'Dispatched',
  'In Transit',
  'Delivered',
];

export const TRANSPORT_MODES = ['Truck', 'Ocean', 'Air'];
