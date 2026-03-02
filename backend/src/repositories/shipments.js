/**
 * Shipments repository – maps domain fields to/from Google Sheet columns.
 * Columns: ShipmentNumber, AssignedTo, CustomerEmail, CurrentStatus, CurrentLocationName,
 * Latitude, Longitude, TransportMode, PickupLocationName, PickupLat, PickupLng,
 * DestinationName, DestinationLat, DestinationLng, LastUpdatedTime, CreatedAt
 */
import {
  getSheetRows,
  appendSheetRow,
  updateSheetRow,
} from '../db/sheets.js';

const SHIPMENTS_SHEET = process.env.SHEET_SHIPMENTS || 'Shipments';

const HEADERS = [
  'ShipmentNumber',
  'AssignedTo',
  'CustomerEmail',
  'CurrentStatus',
  'CurrentLocationName',
  'Latitude',
  'Longitude',
  'TransportMode',
  'PickupLocationName',
  'PickupLat',
  'PickupLng',
  'DestinationName',
  'DestinationLat',
  'DestinationLng',
  'LastUpdatedTime',
  'CreatedAt',
];

function parseNum(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : null;
}

function rowToShipment(row) {
  return {
    shipmentNumber: row.ShipmentNumber || '',
    assignedTo: row.AssignedTo || '',
    customerEmail: row.CustomerEmail || '',
    currentStatus: row.CurrentStatus || '',
    currentLocationName: row.CurrentLocationName || '',
    latitude: parseNum(row.Latitude),
    longitude: parseNum(row.Longitude),
    transportMode: row.TransportMode || '',
    pickupLocationName: row.PickupLocationName || '',
    pickupLat: parseNum(row.PickupLat),
    pickupLng: parseNum(row.PickupLng),
    destinationName: row.DestinationName || '',
    destinationLat: parseNum(row.DestinationLat),
    destinationLng: parseNum(row.DestinationLng),
    lastUpdatedTime: row.LastUpdatedTime || '',
    createdAt: row.CreatedAt || '',
  };
}

function shipmentToRow(s) {
  return [
    s.shipmentNumber || '',
    s.assignedTo || '',
    s.customerEmail || '',
    s.currentStatus || '',
    s.currentLocationName || '',
    s.latitude != null ? String(s.latitude) : '',
    s.longitude != null ? String(s.longitude) : '',
    s.transportMode || '',
    s.pickupLocationName || '',
    s.pickupLat != null ? String(s.pickupLat) : '',
    s.pickupLng != null ? String(s.pickupLng) : '',
    s.destinationName || '',
    s.destinationLat != null ? String(s.destinationLat) : '',
    s.destinationLng != null ? String(s.destinationLng) : '',
    s.lastUpdatedTime || '',
    s.createdAt || '',
  ];
}

export async function getAllShipments() {
  const rows = await getSheetRows(SHIPMENTS_SHEET);
  return rows.map(rowToShipment);
}

export async function getShipmentByNumber(shipmentNumber) {
  const rows = await getSheetRows(SHIPMENTS_SHEET);
  const row = rows.find(
    (r) => (r.ShipmentNumber || '').toString().toLowerCase() === String(shipmentNumber).toLowerCase()
  );
  return row ? rowToShipment(row) : null;
}

export async function getShipmentRowIndex(shipmentNumber) {
  const rows = await getSheetRows(SHIPMENTS_SHEET);
  const idx = rows.findIndex(
    (r) => (r.ShipmentNumber || '').toString().toLowerCase() === String(shipmentNumber).toLowerCase()
  );
  return idx >= 0 ? idx : -1;
}

export async function createShipment(shipment) {
  const now = new Date().toISOString();
  const s = {
    ...shipment,
    lastUpdatedTime: shipment.lastUpdatedTime || now,
    createdAt: shipment.createdAt || now,
  };
  const row = shipmentToRow(s);
  // Ensure row length matches headers
  while (row.length < HEADERS.length) row.push('');
  await appendSheetRow(SHIPMENTS_SHEET, row.slice(0, HEADERS.length));
  return s;
}

export async function updateShipment(shipmentNumber, updates) {
  const existing = await getShipmentByNumber(shipmentNumber);
  if (!existing) return null;
  const idx = await getShipmentRowIndex(shipmentNumber);
  const merged = {
    ...existing,
    ...updates,
    shipmentNumber: existing.shipmentNumber,
    lastUpdatedTime: new Date().toISOString(),
  };
  const row = shipmentToRow(merged);
  while (row.length < HEADERS.length) row.push('');
  await updateSheetRow(SHIPMENTS_SHEET, idx, row.slice(0, HEADERS.length));
  return merged;
}

export async function getActiveShipments() {
  const all = await getAllShipments();
  const delivered = 'Delivered';
  return all.filter((s) => (s.currentStatus || '') !== delivered);
}
