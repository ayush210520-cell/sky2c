/**
 * Scheduled jobs – e.g. simulate location updates for demo (cron).
 * Run with: npm run cron (or start is enough as server starts cron).
 */
import cron from 'node-cron';
import * as shipmentRepo from '../repositories/shipments.js';

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/5 * * * *'; // every 5 minutes

/**
 * Optional: demo job that slightly moves a random active shipment's coordinates.
 * Disable in production or replace with real GPS/API updates.
 */
async function simulateLocationUpdates() {
  try {
    const active = await shipmentRepo.getActiveShipments();
    if (active.length === 0) return;
    const shipment = active[Math.floor(Math.random() * active.length)];
    const lat = shipment.latitude ?? 28.6139;
    const lng = shipment.longitude ?? 77.209;
    const jitter = 0.01;
    const newLat = lat + (Math.random() - 0.5) * jitter;
    const newLng = lng + (Math.random() - 0.5) * jitter;
    await shipmentRepo.updateShipment(shipment.shipmentNumber, {
      latitude: newLat,
      longitude: newLng,
      lastUpdatedTime: new Date().toISOString(),
    });
    console.log(`[Cron] Simulated location update for ${shipment.shipmentNumber}`);
  } catch (err) {
    console.error('[Cron] simulateLocationUpdates error:', err.message);
  }
}

export function startCronJobs() {
  if (process.env.DISABLE_CRON === 'true') return;
  cron.schedule(CRON_SCHEDULE, simulateLocationUpdates);
  console.log(`Cron scheduled: ${CRON_SCHEDULE}`);
}
