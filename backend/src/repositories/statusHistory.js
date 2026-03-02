/**
 * Shipment status history repository – append-only log in Google Sheet.
 * Columns: ShipmentNumber, Status, LocationName, Latitude, Longitude, RecordedAt
 */
import { getSheetRows, appendSheetRow } from '../db/sheets.js';

const HISTORY_SHEET = process.env.SHEET_STATUS_HISTORY || 'Shipment Status History';

const HEADERS = [
  'ShipmentNumber',
  'Status',
  'LocationName',
  'Latitude',
  'Longitude',
  'RecordedAt',
];

export async function addStatusHistory(entry) {
  const row = [
    entry.shipmentNumber || '',
    entry.status || '',
    entry.locationName || '',
    entry.latitude != null ? String(entry.latitude) : '',
    entry.longitude != null ? String(entry.longitude) : '',
    entry.recordedAt || new Date().toISOString(),
  ];
  await appendSheetRow(HISTORY_SHEET, row);
}

export async function getStatusHistory(shipmentNumber) {
  const rows = await getSheetRows(HISTORY_SHEET);
  return rows
    .filter((r) => (r.ShipmentNumber || '').toString() === String(shipmentNumber))
    .map((r) => ({
      shipmentNumber: r.ShipmentNumber,
      status: r.Status,
      locationName: r.LocationName,
      latitude: r.Latitude ? parseFloat(r.Latitude) : null,
      longitude: r.Longitude ? parseFloat(r.Longitude) : null,
      recordedAt: r.RecordedAt,
    }))
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
}
