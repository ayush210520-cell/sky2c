/**
 * Shipment service – business logic: status updates, history, email triggers.
 * Resolves location names to lat/lng via geocoding when not provided.
 */
import * as shipmentRepo from '../repositories/shipments.js';
import * as historyRepo from '../repositories/statusHistory.js';
import { sendStatusUpdateEmail } from './email.js';
import { geocodeWithDelay } from './geocode.js';
import { pushShipmentToZoho, isZohoEnabled } from './zoho.js';
import {
  STATUS_FLOW,
  isValidStatus,
  getStatusIndex,
  EMAIL_TRIGGER_STATUSES,
} from '../constants/status.js';

export async function createShipment(data) {
  const shipmentNumber = data.shipmentNumber || generateShipmentNumber();
  const currentLocationName = data.currentLocationName || '';
  const pickupLocationName = data.pickupLocationName || '';
  const destinationName = data.destinationName || '';

  let latitude = data.latitude ?? null;
  let longitude = data.longitude ?? null;
  let pickupLat = data.pickupLat ?? null;
  let pickupLng = data.pickupLng ?? null;
  let destinationLat = data.destinationLat ?? null;
  let destinationLng = data.destinationLng ?? null;

  if ((latitude == null || longitude == null) && currentLocationName) {
    const coords = await geocodeWithDelay(currentLocationName);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
    } else {
      latitude = 20.5937;
      longitude = 78.9629;
    }
  }
  if ((pickupLat == null || pickupLng == null) && pickupLocationName) {
    const coords = await geocodeWithDelay(pickupLocationName);
    if (coords) {
      pickupLat = coords.lat;
      pickupLng = coords.lng;
    } else {
      pickupLat = pickupLat ?? 20.5937;
      pickupLng = pickupLng ?? 78.9629;
    }
  }
  if ((destinationLat == null || destinationLng == null) && destinationName) {
    const coords = await geocodeWithDelay(destinationName);
    if (coords) {
      destinationLat = coords.lat;
      destinationLng = coords.lng;
    } else {
      destinationLat = destinationLat ?? 28.6139;
      destinationLng = destinationLng ?? 77.209;
    }
  }

  if (latitude == null && longitude == null && pickupLat != null && pickupLng != null) {
    latitude = pickupLat;
    longitude = pickupLng;
  }
  if (latitude == null || longitude == null) {
    latitude = latitude ?? 20.5937;
    longitude = longitude ?? 78.9629;
  }

  const shipment = {
    shipmentNumber,
    assignedTo: data.assignedTo || '',
    customerEmail: data.customerEmail || '',
    currentStatus: 'Created',
    currentLocationName: currentLocationName || pickupLocationName,
    latitude,
    longitude,
    transportMode: data.transportMode || 'Truck',
    pickupLocationName,
    pickupLat,
    pickupLng,
    destinationName,
    destinationLat,
    destinationLng,
    lastUpdatedTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  await shipmentRepo.createShipment(shipment);
  await historyRepo.addStatusHistory({
    shipmentNumber,
    status: 'Created',
    locationName: shipment.currentLocationName,
    latitude: shipment.latitude,
    longitude: shipment.longitude,
    recordedAt: shipment.lastUpdatedTime,
  });
  if (isZohoEnabled()) {
    pushShipmentToZoho(shipment).catch((err) => console.error('Zoho sync create:', err.message));
  }
  return shipment;
}

export async function assignShipment(shipmentNumber, assignedTo) {
  const updated = await shipmentRepo.updateShipment(shipmentNumber, {
    assignedTo: String(assignedTo).trim(),
  });
  return updated;
}

export async function updateStatus(shipmentNumber, newStatus, locationInfo = {}) {
  if (!isValidStatus(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Allowed: ${STATUS_FLOW.join(', ')}`);
  }
  const existing = await shipmentRepo.getShipmentByNumber(shipmentNumber);
  if (!existing) throw new Error('Shipment not found');
  const currentIdx = getStatusIndex(existing.currentStatus);
  const newIdx = getStatusIndex(newStatus);
  if (newIdx < currentIdx) {
    throw new Error(`Status cannot go backwards from ${existing.currentStatus} to ${newStatus}`);
  }

  const updates = {
    currentStatus: newStatus,
    lastUpdatedTime: new Date().toISOString(),
  };
  if (locationInfo.locationName != null) updates.currentLocationName = locationInfo.locationName;
  if (locationInfo.latitude != null) updates.latitude = locationInfo.latitude;
  if (locationInfo.longitude != null) updates.longitude = locationInfo.longitude;
  if ((updates.latitude == null || updates.longitude == null) && (locationInfo.locationName || '').trim()) {
    const coords = await geocodeWithDelay(locationInfo.locationName.trim());
    if (coords) {
      updates.latitude = coords.lat;
      updates.longitude = coords.lng;
    } else {
      updates.latitude = updates.latitude ?? 20.5937;
      updates.longitude = updates.longitude ?? 78.9629;
    }
  }

  const updated = await shipmentRepo.updateShipment(shipmentNumber, updates);

  await historyRepo.addStatusHistory({
    shipmentNumber,
    status: newStatus,
    locationName: updated.currentLocationName,
    latitude: updated.latitude,
    longitude: updated.longitude,
    recordedAt: updated.lastUpdatedTime,
  });

  if (EMAIL_TRIGGER_STATUSES.includes(newStatus)) {
    await sendStatusUpdateEmail({
      customerEmail: updated.customerEmail,
      shipmentNumber: updated.shipmentNumber,
      currentStatus: updated.currentStatus,
      currentLocationName: updated.currentLocationName,
      assignedTo: updated.assignedTo,
    });
  }

  if (isZohoEnabled()) {
    pushShipmentToZoho(updated).catch((err) => console.error('Zoho sync status:', err.message));
  }
  return updated;
}

export async function updateLocation(shipmentNumber, { locationName, latitude, longitude }) {
  const updates = { lastUpdatedTime: new Date().toISOString() };
  if (locationName != null) updates.currentLocationName = locationName;
  if (latitude != null) updates.latitude = latitude;
  if (longitude != null) updates.longitude = longitude;
  if ((updates.latitude == null || updates.longitude == null) && (locationName || '').trim()) {
    const coords = await geocodeWithDelay(locationName.trim());
    if (coords) {
      updates.latitude = coords.lat;
      updates.longitude = coords.lng;
    } else {
      updates.latitude = updates.latitude ?? 20.5937;
      updates.longitude = updates.longitude ?? 78.9629;
    }
  }
  const updated = await shipmentRepo.updateShipment(shipmentNumber, updates);
  if (isZohoEnabled()) {
    pushShipmentToZoho(updated).catch((err) => console.error('Zoho sync location:', err.message));
  }
  return updated;
}

export async function getShipment(shipmentNumber) {
  return shipmentRepo.getShipmentByNumber(shipmentNumber);
}

export async function getStatusHistory(shipmentNumber) {
  return historyRepo.getStatusHistory(shipmentNumber);
}

export async function getAllShipments() {
  return shipmentRepo.getAllShipments();
}

export async function getActiveShipments() {
  return shipmentRepo.getActiveShipments();
}

function generateShipmentNumber() {
  const prefix = 'SHP';
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${time}-${rand}`;
}
