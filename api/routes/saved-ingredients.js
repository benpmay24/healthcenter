import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Mount at /api/saved-ingredients: request with no path segment has path '' in router
router.get(['', '/'], (req, res) => {
  const rows = db.prepare('SELECT * FROM saved_ingredients ORDER BY name').all();
  res.json(rows);
});

router.post(['', '/'], (req, res) => {
  const {
    name,
    fdc_id,
    quantity = 1,
    serving_grams,
    calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0,
    fiber = 0,
    sodium = null,
  } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  db.prepare(`
    INSERT INTO saved_ingredients (name, fdc_id, quantity, serving_grams, calories, protein, carbs, fat, fiber, sodium)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    fdc_id ?? null,
    Number(quantity) || 1,
    serving_grams ?? null,
    Number(calories) || 0,
    Number(protein) || 0,
    Number(carbs) || 0,
    Number(fat) || 0,
    Number(fiber) || 0,
    sodium != null ? Number(sodium) : null
  );
  const row = db.prepare('SELECT * FROM saved_ingredients ORDER BY id DESC LIMIT 1').get();
  res.status(201).json(row);
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM saved_ingredients WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Saved ingredient not found' });
  db.prepare('DELETE FROM saved_ingredients WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
