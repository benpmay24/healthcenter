import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const row = db.prepare('SELECT height_cm, goal_calories, goal_protein, goal_carbs, goal_fat FROM user_settings WHERE id = 1').get();
  res.json(row || { height_cm: null, goal_calories: null, goal_protein: null, goal_carbs: null, goal_fat: null });
});

router.put('/', (req, res) => {
  const current = db.prepare('SELECT height_cm, goal_calories, goal_protein, goal_carbs, goal_fat FROM user_settings WHERE id = 1').get() || {};
  const height_cm = req.body.hasOwnProperty('height_cm') ? (req.body.height_cm === '' || req.body.height_cm == null ? null : Number(req.body.height_cm)) : current.height_cm;
  const goal_calories = req.body.hasOwnProperty('goal_calories') ? (req.body.goal_calories === '' || req.body.goal_calories == null ? null : Number(req.body.goal_calories)) : current.goal_calories;
  const goal_protein = req.body.hasOwnProperty('goal_protein') ? (req.body.goal_protein === '' || req.body.goal_protein == null ? null : Number(req.body.goal_protein)) : current.goal_protein;
  const goal_carbs = req.body.hasOwnProperty('goal_carbs') ? (req.body.goal_carbs === '' || req.body.goal_carbs == null ? null : Number(req.body.goal_carbs)) : current.goal_carbs;
  const goal_fat = req.body.hasOwnProperty('goal_fat') ? (req.body.goal_fat === '' || req.body.goal_fat == null ? null : Number(req.body.goal_fat)) : current.goal_fat;
  db.prepare(`
    UPDATE user_settings SET height_cm = ?, goal_calories = ?, goal_protein = ?, goal_carbs = ?, goal_fat = ?, updated_at = datetime('now') WHERE id = 1
  `).run(height_cm, goal_calories, goal_protein, goal_carbs, goal_fat);
  const row = db.prepare('SELECT height_cm, goal_calories, goal_protein, goal_carbs, goal_fat FROM user_settings WHERE id = 1').get();
  res.json(row);
});

export default router;
