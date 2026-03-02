/**
 * In-memory store when Google Sheets is not configured (no API keys).
 * Data resets when server restarts.
 * Includes one demo shipment so you can test tracking without creating one.
 */
const now = new Date().toISOString();

const store = {
  Shipments: [
    [
      'SHP-DEMO-001',
      'DHL Express',
      'customer@example.com',
      'In Transit',
      'Indore Hub',
      '22.7196',
      '75.8577',
      'Truck',
      'Mumbai Warehouse',
      '19.0760',
      '72.8777',
      'Delhi Delivery Center',
      '28.6139',
      '77.2090',
      now,
      '2025-02-25T10:00:00.000Z',
    ],
    [
      'SHP-DEMO-002',
      'Emirates SkyCargo',
      'dubai.client@example.com',
      'In Transit',
      'Mumbai Airport',
      '19.0896',
      '72.8656',
      'Air',
      'Dubai International Airport',
      '25.2532',
      '55.3657',
      'Delhi Delivery Center',
      '28.6139',
      '77.2090',
      now,
      '2025-02-26T08:00:00.000Z',
    ],
  ],
  'Shipment Status History': [
    ['SHP-DEMO-001', 'Created', 'Mumbai Warehouse', '19.0760', '72.8777', '2025-02-25T10:00:00.000Z'],
    ['SHP-DEMO-001', 'Picked Up', 'Mumbai', '19.0760', '72.8777', '2025-02-26T09:00:00.000Z'],
    ['SHP-DEMO-001', 'Dispatched', 'Mumbai Depot', '19.0760', '72.8777', '2025-02-26T14:00:00.000Z'],
    ['SHP-DEMO-001', 'In Transit', 'Indore Hub', '22.7196', '75.8577', now],
    ['SHP-DEMO-002', 'Created', 'Dubai International Airport', '25.2532', '55.3657', '2025-02-26T08:00:00.000Z'],
    ['SHP-DEMO-002', 'Picked Up', 'Dubai Cargo Village', '25.2532', '55.3657', '2025-02-26T12:00:00.000Z'],
    ['SHP-DEMO-002', 'Dispatched', 'Dubai', '25.2532', '55.3657', '2025-02-27T06:00:00.000Z'],
    ['SHP-DEMO-002', 'In Transit', 'Mumbai Airport', '19.0896', '72.8656', now],
  ],
};

function getHeaders(sheetName) {
  if (sheetName === 'Shipments') {
    return [
      'ShipmentNumber', 'AssignedTo', 'CustomerEmail', 'CurrentStatus',
      'CurrentLocationName', 'Latitude', 'Longitude', 'TransportMode',
      'PickupLocationName', 'PickupLat', 'PickupLng',
      'DestinationName', 'DestinationLat', 'DestinationLng',
      'LastUpdatedTime', 'CreatedAt',
    ];
  }
  if (sheetName === 'Shipment Status History') {
    return ['ShipmentNumber', 'Status', 'LocationName', 'Latitude', 'Longitude', 'RecordedAt'];
  }
  return [];
}

export function getSheetRows(sheetName) {
  const rows = store[sheetName];
  if (!rows || rows.length === 0) return [];
  const headers = getHeaders(sheetName);
  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] != null ? String(row[i]).trim() : '';
    });
    return obj;
  });
}

export function appendSheetRow(sheetName, values) {
  if (!store[sheetName]) store[sheetName] = [];
  store[sheetName].push([...values]);
}

export function updateSheetRow(sheetName, rowIndex, values) {
  if (!store[sheetName] || !store[sheetName][rowIndex]) return;
  store[sheetName][rowIndex] = [...values];
}

export function getSheetRowCount(sheetName) {
  const rows = store[sheetName];
  return rows ? rows.length : 0;
}

export function useMemoryStore() {
  return !process.env.GOOGLE_SHEET_ID;
}
