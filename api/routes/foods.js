import { Router } from 'express';
import { searchFoods, getFoodByFdcId } from '../usda.js';

const router = Router();

router.get('/search', async (req, res) => {
  const q = (req.query.q || req.query.query || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'query (q) required' });
  }
  try {
    const { foods, totalHits } = await searchFoods(q, process.env.FDC_API_KEY, 25);
    res.json({ foods, totalHits });
  } catch (err) {
    console.error('USDA search error', err);
    const status = err.rateLimit ? 429 : 502;
    res.status(status).json({ error: err.message || 'Food search failed', rateLimit: !!err.rateLimit });
  }
});

router.get('/:fdcId', async (req, res) => {
  const fdcId = Number(req.params.fdcId);
  if (Number.isNaN(fdcId)) return res.status(400).json({ error: 'Invalid fdcId' });
  try {
    const food = await getFoodByFdcId(fdcId, process.env.FDC_API_KEY);
    res.json(food);
  } catch (err) {
    console.error('USDA food fetch error', err);
    const status = err.rateLimit ? 429 : 502;
    res.status(status).json({ error: err.message || 'Food fetch failed', rateLimit: !!err.rateLimit });
  }
});

export default router;
