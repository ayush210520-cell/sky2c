/**
 * REST API routes for shipments.
 * Base path: /api/shipments
 */
import { Router } from 'express';
import * as shipmentService from '../services/shipmentService.js';

const router = Router();

// Create shipment
router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const shipment = await shipmentService.createShipment({
      shipmentNumber: body.shipmentNumber,
      assignedTo: body.assignedTo,
      customerEmail: body.customerEmail,
      currentLocationName: body.currentLocationName,
      latitude: body.latitude,
      longitude: body.longitude,
      transportMode: body.transportMode,
      pickupLocationName: body.pickupLocationName,
      pickupLat: body.pickupLat,
      pickupLng: body.pickupLng,
      destinationName: body.destinationName,
      destinationLat: body.destinationLat,
      destinationLng: body.destinationLng,
    });
    res.status(201).json(shipment);
  } catch (err) {
    next(err);
  }
});

// Get all shipments
router.get('/', async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const list = activeOnly
      ? await shipmentService.getActiveShipments()
      : await shipmentService.getAllShipments();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Get shipment by number (for tracking page)
router.get('/:shipmentNumber', async (req, res, next) => {
  try {
    const { shipmentNumber } = req.params;
    const shipment = await shipmentService.getShipment(shipmentNumber);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

// Get status history for a shipment
router.get('/:shipmentNumber/history', async (req, res, next) => {
  try {
    const { shipmentNumber } = req.params;
    const shipment = await shipmentService.getShipment(shipmentNumber);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    const history = await shipmentService.getStatusHistory(shipmentNumber);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// Assign shipment (Transporter / Shipping Line / Airline)
router.patch('/:shipmentNumber/assign', async (req, res, next) => {
  try {
    const { shipmentNumber } = req.params;
    const { assignedTo } = req.body || {};
    if (assignedTo == null) return res.status(400).json({ error: 'assignedTo is required' });
    const updated = await shipmentService.assignShipment(shipmentNumber, assignedTo);
    if (!updated) return res.status(404).json({ error: 'Shipment not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Update shipment status (triggers history + email if applicable)
router.patch('/:shipmentNumber/status', async (req, res, next) => {
  try {
    const { shipmentNumber } = req.params;
    const { status, locationName, latitude, longitude } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status is required' });
    const updated = await shipmentService.updateStatus(shipmentNumber, status, {
      locationName,
      latitude,
      longitude,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Update shipment location only
router.patch('/:shipmentNumber/location', async (req, res, next) => {
  try {
    const { shipmentNumber } = req.params;
    const { locationName, latitude, longitude } = req.body || {};
    const updated = await shipmentService.updateLocation(shipmentNumber, {
      locationName,
      latitude,
      longitude,
    });
    if (!updated) return res.status(404).json({ error: 'Shipment not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export { router as shipmentRoutes };
