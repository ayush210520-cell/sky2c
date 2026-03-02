/**
 * Express server entry point.
 * Uses in-memory store when GOOGLE_SHEET_ID is not set (no API keys needed).
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { shipmentRoutes } from './routes/shipments.js';
import { geocodeRoutes } from './routes/geocode.js';
import { zohoRoutes } from './routes/zoho.js';
import { startCronJobs } from './jobs/cron.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Shipment API running',
    storage: process.env.GOOGLE_SHEET_ID ? 'google_sheets' : 'memory',
  });
});

// Mount shipment APIs
app.use('/api/shipments', shipmentRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/zoho', zohoRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (!process.env.GOOGLE_SHEET_ID) {
    console.log('Using in-memory storage (no API keys). Set GOOGLE_SHEET_ID to use Google Sheets.');
  }
  startCronJobs();
});
