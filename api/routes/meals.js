import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date query required' });
  }
  const meals = db.prepare(`
    SELECT * FROM meals WHERE date = ? ORDER BY created_at
  `).all(date);
  const withIngredients = meals.map((meal) => {
    const ingredients = db.prepare(`
      SELECT * FROM meal_ingredients WHERE meal_id = ? ORDER BY created_at
    `).all(meal.id);
    return { ...meal, ingredients };
  });
  res.json(withIngredients);
});

router.post('/', (req, res) => {
  const { date, name } = req.body;
  if (!date || !name?.trim()) {
    return res.status(400).json({ error: 'date and name required' });
  }
  const run = db.prepare('INSERT INTO meals (date, name) VALUES (?, ?)');
  const result = run.run(date, name.trim());
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...meal, ingredients: [] });
});

router.get('/:id', (req, res) => {
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  const ingredients = db.prepare('SELECT * FROM meal_ingredients WHERE meal_id = ? ORDER BY created_at').all(meal.id);
  res.json({ ...meal, ingredients });
});

router.patch('/:id', (req, res) => {
  const { name } = req.body;
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  if (name?.trim()) {
    db.prepare('UPDATE meals SET name = ? WHERE id = ?').run(name.trim(), meal.id);
  }
  const updated = db.prepare('SELECT * FROM meals WHERE id = ?').get(meal.id);
  const ingredients = db.prepare('SELECT * FROM meal_ingredients WHERE meal_id = ?').all(meal.id);
  res.json({ ...updated, ingredients });
});

router.delete('/:id', (req, res) => {
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  db.prepare('DELETE FROM meal_ingredients WHERE meal_id = ?').run(meal.id);
  db.prepare('DELETE FROM meals WHERE id = ?').run(meal.id);
  res.status(204).send();
});

export default router;
