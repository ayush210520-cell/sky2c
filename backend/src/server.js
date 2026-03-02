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

// Prevent process crash on unhandled errors (e.g. in Zoho fetch)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const app = express();
const PORT = process.env.PORT || 5001;

// CORS: allow FRONTEND_URL (comma-separated) + always allow sky2c.vercel.app
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()).filter(Boolean)
  : [];
const normalizeOrigin = (u) => (u ? String(u).replace(/\/+$/, '') : '');
const ALLOWED_ORIGINS = [...new Set([...frontendUrls.map(normalizeOrigin), 'https://sky2c.vercel.app'])];
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const o = normalizeOrigin(origin);
    if (ALLOWED_ORIGINS.includes(o)) return cb(null, origin);
    return cb(null, false);
  },
  credentials: true,
};
app.use(cors(corsOptions));
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
