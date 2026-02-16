import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date query required' });
  }
  const meals = await db.all('SELECT * FROM meals WHERE date = ? ORDER BY created_at', date);
  const withIngredients = await Promise.all(
    meals.map(async (meal) => {
      const ingredients = await db.all('SELECT * FROM meal_ingredients WHERE meal_id = ? ORDER BY created_at', meal.id);
      return { ...meal, ingredients };
    })
  );
  res.json(withIngredients);
});

router.post('/', async (req, res) => {
  const { date, name } = req.body;
  if (!date || !name?.trim()) {
    return res.status(400).json({ error: 'date and name required' });
  }
  const result = await db.run('INSERT INTO meals (date, name) VALUES (?, ?)', date, name.trim());
  const meal = await db.get('SELECT * FROM meals WHERE id = ?', result.lastInsertRowid);
  res.status(201).json({ ...meal, ingredients: [] });
});

router.get('/:id', async (req, res) => {
  const meal = await db.get('SELECT * FROM meals WHERE id = ?', req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  const ingredients = await db.all('SELECT * FROM meal_ingredients WHERE meal_id = ? ORDER BY created_at', meal.id);
  res.json({ ...meal, ingredients });
});

router.patch('/:id', async (req, res) => {
  const { name } = req.body;
  const meal = await db.get('SELECT * FROM meals WHERE id = ?', req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  if (name?.trim()) {
    await db.run('UPDATE meals SET name = ? WHERE id = ?', name.trim(), meal.id);
  }
  const updated = await db.get('SELECT * FROM meals WHERE id = ?', meal.id);
  const ingredients = await db.all('SELECT * FROM meal_ingredients WHERE meal_id = ?', meal.id);
  res.json({ ...updated, ingredients });
});

router.delete('/:id', async (req, res) => {
  const meal = await db.get('SELECT * FROM meals WHERE id = ?', req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  await db.run('DELETE FROM meal_ingredients WHERE meal_id = ?', meal.id);
  await db.run('DELETE FROM meals WHERE id = ?', meal.id);
  res.status(204).send();
});

export default router;
