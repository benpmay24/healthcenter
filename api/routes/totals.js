import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/:date', async (req, res) => {
  const { date } = req.params;
  const meals = await db.all('SELECT id FROM meals WHERE date = ?', date);
  const mealIds = meals.map((m) => m.id);
  if (mealIds.length === 0) {
    return res.json({
      date,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sodium: null,
      meals: [],
    });
  }
  const placeholders = mealIds.map(() => '?').join(',');
  const ingredients = await db.all(
    `SELECT meal_id, calories, protein, carbs, fat, fiber, sodium
    FROM meal_ingredients WHERE meal_id IN (${placeholders})`,
    ...mealIds
  );

  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
  };
  const byMeal = {};
  for (const i of ingredients) {
    const c = Number(i.calories) || 0;
    const p = Number(i.protein) || 0;
    const carb = Number(i.carbs) || 0;
    const f = Number(i.fat) || 0;
    const fib = Number(i.fiber) || 0;
    const s = Number(i.sodium) || 0;
    totals.calories += c;
    totals.protein += p;
    totals.carbs += carb;
    totals.fat += f;
    totals.fiber += fib;
    totals.sodium += s;
    byMeal[i.meal_id] = (byMeal[i.meal_id] || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });
    byMeal[i.meal_id].calories += c;
    byMeal[i.meal_id].protein += p;
    byMeal[i.meal_id].carbs += carb;
    byMeal[i.meal_id].fat += f;
    byMeal[i.meal_id].fiber += fib;
    byMeal[i.meal_id].sodium += s;
  }
  const mealList = await db.all('SELECT id, name FROM meals WHERE date = ? ORDER BY created_at', date);
  const empty = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };
  res.json({
    date,
    ...totals,
    meals: mealList.map((m) => ({ ...m, totals: byMeal[m.id] || empty })),
  });
});

export default router;
