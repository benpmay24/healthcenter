import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const row = await db.get('SELECT height_cm, goal_calories, goal_protein, goal_carbs, goal_fat FROM user_settings WHERE id = 1');
  res.json(row || { height_cm: null, goal_calories: null, goal_protein: null, goal_carbs: null, goal_fat: null });
});

router.put('/', async (req, res) => {
  const current = (await db.get('SELECT height_cm, goal_calories, goal_protein, goal_carbs, goal_fat FROM user_settings WHERE id = 1')) || {};
  const height_cm = req.body.hasOwnProperty('height_cm') ? (req.body.height_cm === '' || req.body.height_cm == null ? null : Number(req.body.height_cm)) : current.height_cm;
  const goal_calories = req.body.hasOwnProperty('goal_calories') ? (req.body.goal_calories === '' || req.body.goal_calories == null ? null : Number(req.body.goal_calories)) : current.goal_calories;
  const goal_protein = req.body.hasOwnProperty('goal_protein') ? (req.body.goal_protein === '' || req.body.goal_protein == null ? null : Number(req.body.goal_protein)) : current.goal_protein;
  const goal_carbs = req.body.hasOwnProperty('goal_carbs') ? (req.body.goal_carbs === '' || req.body.goal_carbs == null ? null : Number(req.body.goal_carbs)) : current.goal_carbs;
  const goal_fat = req.body.hasOwnProperty('goal_fat') ? (req.body.goal_fat === '' || req.body.goal_fat == null ? null : Number(req.body.goal_fat)) : current.goal_fat;
  await db.run(
    'UPDATE user_settings SET height_cm = ?, goal_calories = ?, goal_protein = ?, goal_carbs = ?, goal_fat = ?, updated_at = ? WHERE id = 1',
    height_cm,
    goal_calories,
    goal_protein,
    goal_carbs,
    goal_fat,
    new Date().toISOString()
  );
  const row = await db.get('SELECT height_cm, goal_calories, goal_protein, goal_carbs, goal_fat FROM user_settings WHERE id = 1');
  res.json(row);
});

export default router;
