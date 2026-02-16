import { Router } from 'express';
import db from '../db.js';

const router = Router({ mergeParams: true });

router.post('/', (req, res) => {
  const mealId = Number(req.params.mealId);
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(mealId);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

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

  if (!name?.trim()) {
    return res.status(400).json({ error: 'name required' });
  }

  const run = db.prepare(`
    INSERT INTO meal_ingredients (meal_id, name, fdc_id, quantity, serving_grams, calories, protein, carbs, fat, fiber, sodium)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  run.run(
    mealId,
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
  const row = db.prepare('SELECT * FROM meal_ingredients WHERE meal_id = ? ORDER BY id DESC LIMIT 1').get(mealId);
  res.status(201).json(row);
});

router.delete('/:ingredientId', (req, res) => {
  const mealId = Number(req.params.mealId);
  const ingredientId = Number(req.params.ingredientId);
  const ingredient = db.prepare('SELECT * FROM meal_ingredients WHERE id = ? AND meal_id = ?').get(ingredientId, mealId);
  if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
  db.prepare('DELETE FROM meal_ingredients WHERE id = ?').run(ingredientId);
  res.status(204).send();
});

export default router;
