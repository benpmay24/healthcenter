import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Mount at /api/saved-meals: request with no path segment has path '' in router
router.get(['', '/'], (req, res) => {
  const meals = db.prepare('SELECT * FROM saved_meals ORDER BY name').all();
  const withIngredients = meals.map((meal) => {
    const ingredients = db.prepare(`
      SELECT * FROM saved_meal_ingredients WHERE saved_meal_id = ? ORDER BY created_at
    `).all(meal.id);
    return { ...meal, ingredients };
  });
  res.json(withIngredients);
});

router.get('/:id', (req, res) => {
  const meal = db.prepare('SELECT * FROM saved_meals WHERE id = ?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Saved meal not found' });
  const ingredients = db.prepare(`
    SELECT * FROM saved_meal_ingredients WHERE saved_meal_id = ? ORDER BY created_at
  `).all(meal.id);
  res.json({ ...meal, ingredients });
});

const createSavedMeal = (req, res) => {
  const { name, ingredients } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const run = db.prepare('INSERT INTO saved_meals (name) VALUES (?)');
  const result = run.run(name.trim());
  const mealId = result.lastInsertRowid;
  const insert = db.prepare(`
    INSERT INTO saved_meal_ingredients (saved_meal_id, name, fdc_id, quantity, serving_grams, calories, protein, carbs, fat, fiber, sodium)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const ing of ingredients || []) {
    insert.run(
      mealId,
      ing.name || 'Ingredient',
      ing.fdc_id ?? null,
      Number(ing.quantity) || 1,
      ing.serving_grams ?? null,
      Number(ing.calories) || 0,
      Number(ing.protein) || 0,
      Number(ing.carbs) || 0,
      Number(ing.fat) || 0,
      Number(ing.fiber) || 0,
      ing.sodium != null ? Number(ing.sodium) : null
    );
  }
  const meal = db.prepare('SELECT * FROM saved_meals WHERE id = ?').get(mealId);
  const ings = db.prepare('SELECT * FROM saved_meal_ingredients WHERE saved_meal_id = ?').all(mealId);
  res.status(201).json({ ...meal, ingredients: ings });
};

// Mount at /api/saved-meals: POST with no path segment has path '' in router, not '/'
router.post(['', '/'], createSavedMeal);

router.post('/:id/add-to-day', (req, res) => {
  const savedMeal = db.prepare('SELECT * FROM saved_meals WHERE id = ?').get(req.params.id);
  if (!savedMeal) return res.status(404).json({ error: 'Saved meal not found' });
  const date = req.body.date || req.query.date;
  if (!date) return res.status(400).json({ error: 'date required' });
  const ingredients = db.prepare(`
    SELECT * FROM saved_meal_ingredients WHERE saved_meal_id = ? ORDER BY created_at
  `).all(savedMeal.id);
  const mealRun = db.prepare('INSERT INTO meals (date, name) VALUES (?, ?)');
  const mealResult = mealRun.run(date, savedMeal.name);
  const mealId = mealResult.lastInsertRowid;
  const insertIng = db.prepare(`
    INSERT INTO meal_ingredients (meal_id, name, fdc_id, quantity, serving_grams, calories, protein, carbs, fat, fiber, sodium)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const ing of ingredients) {
    insertIng.run(
      mealId,
      ing.name,
      ing.fdc_id,
      ing.quantity,
      ing.serving_grams,
      ing.calories,
      ing.protein,
      ing.carbs,
      ing.fat,
      ing.fiber,
      ing.sodium
    );
  }
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(mealId);
  const newIngredients = db.prepare('SELECT * FROM meal_ingredients WHERE meal_id = ?').all(mealId);
  res.status(201).json({ ...meal, ingredients: newIngredients });
});

router.delete('/:id', (req, res) => {
  const meal = db.prepare('SELECT * FROM saved_meals WHERE id = ?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Saved meal not found' });
  db.prepare('DELETE FROM saved_meal_ingredients WHERE saved_meal_id = ?').run(meal.id);
  db.prepare('DELETE FROM saved_meals WHERE id = ?').run(meal.id);
  res.status(204).send();
});

export default router;