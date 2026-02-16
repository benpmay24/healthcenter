import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/macros', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to date required (YYYY-MM-DD)' });
  }
  const meals = await db.all('SELECT id, date FROM meals WHERE date >= ? AND date <= ? ORDER BY date', from, to);
  const mealIds = meals.map((m) => m.id);
  if (mealIds.length === 0) {
    return res.json({ byDate: [] });
  }
  const placeholders = mealIds.map(() => '?').join(',');
  const ingredients = await db.all(
    `SELECT meal_id, calories, protein, carbs, fat, fiber
    FROM meal_ingredients WHERE meal_id IN (${placeholders})`,
    ...mealIds
  );

  const dateToMealIds = {};
  for (const m of meals) {
    if (!dateToMealIds[m.date]) dateToMealIds[m.date] = [];
    dateToMealIds[m.date].push(m.id);
  }
  const byDate = [];
  for (const date of Object.keys(dateToMealIds).sort()) {
    const ids = new Set(dateToMealIds[date]);
    const dayIngredients = ingredients.filter((i) => ids.has(i.meal_id));
    const totals = {
      date,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
    for (const i of dayIngredients) {
      totals.calories += Number(i.calories) || 0;
      totals.protein += Number(i.protein) || 0;
      totals.carbs += Number(i.carbs) || 0;
      totals.fat += Number(i.fat) || 0;
      totals.fiber += Number(i.fiber) || 0;
    }
    byDate.push(totals);
  }
  res.json({ byDate });
});

router.get('/weight', async (req, res) => {
  const { from, to } = req.query;
  const KG_TO_LBS = 2.20462262185;
  let sql = 'SELECT date, weight_kg FROM weight_log';
  const params = [];
  if (from && to) {
    sql += ' WHERE date >= ? AND date <= ?';
    params.push(from, to);
  } else if (from) {
    sql += ' WHERE date >= ?';
    params.push(from);
  } else if (to) {
    sql += ' WHERE date <= ?';
    params.push(to);
  }
  sql += ' ORDER BY date';
  const rows = params.length ? await db.all(sql, ...params) : await db.all(sql);
  const data = rows.map((r) => ({
    date: r.date,
    weight_kg: r.weight_kg,
    weight_lbs: Math.round(r.weight_kg * KG_TO_LBS * 100) / 100,
  }));
  res.json({ data });
});

export default router;
