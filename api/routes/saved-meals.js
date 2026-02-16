import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get(['', '/'], async (req, res) => {
  const meals = await db.all('SELECT * FROM saved_meals ORDER BY name');
  const withIngredients = await Promise.all(
    meals.map(async (meal) => {
      const ingredients = await db.all('SELECT * FROM saved_meal_ingredients WHERE saved_meal_id = ? ORDER BY created_at', meal.id);
      return { ...meal, ingredients };
    })
  );
  res.json(withIngredients);
});

router.get('/:id', async (req, res) => {
  const meal = await db.get('SELECT * FROM saved_meals WHERE id = ?', req.params.id);
  if (!meal) return res.status(404).json({ error: 'Saved meal not found' });
  const ingredients = await db.all('SELECT * FROM saved_meal_ingredients WHERE saved_meal_id = ? ORDER BY created_at', meal.id);
  res.json({ ...meal, ingredients });
});

router.post(['', '/'], async (req, res) => {
  const { name, ingredients } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const result = await db.run('INSERT INTO saved_meals (name) VALUES (?)', name.trim());
  const mealId = result.lastInsertRowid;
  for (const ing of ingredients || []) {
    await db.run(
      `INSERT INTO saved_meal_ingredients (saved_meal_id, name, fdc_id, quantity, serving_grams, calories, protein, carbs, fat, fiber, sodium)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  const meal = await db.get('SELECT * FROM saved_meals WHERE id = ?', mealId);
  const ings = await db.all('SELECT * FROM saved_meal_ingredients WHERE saved_meal_id = ?', mealId);
  res.status(201).json({ ...meal, ingredients: ings });
});

router.post('/:id/add-to-day', async (req, res) => {
  const savedMeal = await db.get('SELECT * FROM saved_meals WHERE id = ?', req.params.id);
  if (!savedMeal) return res.status(404).json({ error: 'Saved meal not found' });
  const date = req.body.date || req.query.date;
  if (!date) return res.status(400).json({ error: 'date required' });
  const ingredients = await db.all('SELECT * FROM saved_meal_ingredients WHERE saved_meal_id = ? ORDER BY created_at', savedMeal.id);
  const mealResult = await db.run('INSERT INTO meals (date, name) VALUES (?, ?)', date, savedMeal.name);
  const mealId = mealResult.lastInsertRowid;
  for (const ing of ingredients) {
    await db.run(
      `INSERT INTO meal_ingredients (meal_id, name, fdc_id, quantity, serving_grams, calories, protein, carbs, fat, fiber, sodium)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  const meal = await db.get('SELECT * FROM meals WHERE id = ?', mealId);
  const newIngredients = await db.all('SELECT * FROM meal_ingredients WHERE meal_id = ?', mealId);
  res.status(201).json({ ...meal, ingredients: newIngredients });
});

router.delete('/:id', async (req, res) => {
  const meal = await db.get('SELECT * FROM saved_meals WHERE id = ?', req.params.id);
  if (!meal) return res.status(404).json({ error: 'Saved meal not found' });
  await db.run('DELETE FROM saved_meal_ingredients WHERE saved_meal_id = ?', meal.id);
  await db.run('DELETE FROM saved_meals WHERE id = ?', meal.id);
  res.status(204).send();
});

export default router;
