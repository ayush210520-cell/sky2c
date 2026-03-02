/**
 * Geocode suggestions for location autocomplete.
 * GET /api/geocode/suggest?q=indore
 */
import { Router } from 'express';
import { suggest } from '../services/geocode.js';

const router = Router();

router.get('/suggest', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const list = await suggest(q);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

export { router as geocodeRoutes };
