/**
 * Database layer: Google Sheets API when GOOGLE_SHEET_ID is set,
 * otherwise in-memory store (no API keys needed).
 */
import * as memory from './memoryStore.js';

function useGoogleSheets() {
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (!sheetId || sheetId === 'YOUR_GOOGLE_SHEET_ID') return false;
  if (!key || key.includes('YOUR_PRIVATE_KEY') || !key.includes('BEGIN')) return false;
  return true;
}

async function getSheetFromGoogle(sheetName) {
  const { google } = await import('googleapis');
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  return { sheets, spreadsheetId, sheetName };
}

export async function getSheetRows(sheetName) {
  if (!useGoogleSheets()) {
    return memory.getSheetRows(sheetName);
  }
  const { sheets, spreadsheetId, sheetName: name } = await getSheetFromGoogle(sheetName);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${name}'!A:Z`,
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => (h || '').toString().trim());
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] != null ? String(row[i]).trim() : '';
    });
    return obj;
  });
}

export async function appendSheetRow(sheetName, values) {
  if (!useGoogleSheets()) {
    return memory.appendSheetRow(sheetName, values);
  }
  const { sheets, spreadsheetId, sheetName: name } = await getSheetFromGoogle(sheetName);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${name}'!A:Z`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

export async function updateSheetRow(sheetName, rowIndex, values) {
  if (!useGoogleSheets()) {
    return memory.updateSheetRow(sheetName, rowIndex, values);
  }
  const { sheets, spreadsheetId, sheetName: name } = await getSheetFromGoogle(sheetName);
  const range = `'${name}'!A${rowIndex + 1}:Z${rowIndex + 1}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

export async function getSheetRowCount(sheetName) {
  const rows = await getSheetRows(sheetName);
  return rows.length;
}
