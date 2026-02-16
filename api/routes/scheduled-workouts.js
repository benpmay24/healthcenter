import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get(['', '/'], async (req, res) => {
  const { date, from, to } = req.query;
  if (date) {
    const rows = await db.all('SELECT * FROM scheduled_workouts WHERE date = ? ORDER BY sort_order, id', date);
    return res.json(rows);
  }
  if (from && to) {
    const rows = await db.all('SELECT * FROM scheduled_workouts WHERE date >= ? AND date <= ? ORDER BY date, sort_order, id', from, to);
    return res.json(rows);
  }
  return res.status(400).json({ error: 'Provide date or from+to' });
});

router.post(['', '/'], async (req, res) => {
  const { date, exercise_name, category, reps } = req.body;
  if (!date || !exercise_name?.trim()) return res.status(400).json({ error: 'date and exercise_name required' });
  const categoryVal = category || 'other';
  const maxOrder = await db.get('SELECT COALESCE(MAX(sort_order), -1) + 1 as n FROM scheduled_workouts WHERE date = ?', date);
  await db.run(
    'INSERT INTO scheduled_workouts (date, exercise_name, category, reps, sort_order) VALUES (?, ?, ?, ?, ?)',
    date,
    exercise_name.trim(),
    categoryVal,
    Number(reps) || 0,
    maxOrder.n
  );
  const row = await db.get('SELECT * FROM scheduled_workouts WHERE date = ? ORDER BY id DESC LIMIT 1', date);
  res.status(201).json(row);
});

router.post('/from-routine', async (req, res) => {
  const { date, routine_id } = req.body;
  if (!date || !routine_id) return res.status(400).json({ error: 'date and routine_id required' });
  const exercises = await db.all(
    `SELECT e.name, e.category, re.reps
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.sort_order, re.id`,
    routine_id
  );
  if (exercises.length === 0) return res.status(400).json({ error: 'Routine has no exercises' });
  const maxOrder = await db.get('SELECT COALESCE(MAX(sort_order), -1) as n FROM scheduled_workouts WHERE date = ?', date);
  let order = (maxOrder?.n ?? -1) + 1;
  for (const ex of exercises) {
    await db.run(
      'INSERT INTO scheduled_workouts (date, exercise_name, category, reps, sort_order) VALUES (?, ?, ?, ?, ?)',
      date,
      ex.name,
      ex.category,
      ex.reps,
      order++
    );
  }
  const rows = await db.all('SELECT * FROM scheduled_workouts WHERE date = ? ORDER BY sort_order, id', date);
  res.status(201).json(rows);
});

router.delete('/:id', async (req, res) => {
  const row = await db.get('SELECT * FROM scheduled_workouts WHERE id = ?', req.params.id);
  if (!row) return res.status(404).json({ error: 'Scheduled workout not found' });
  await db.run('DELETE FROM scheduled_workouts WHERE id = ?', req.params.id);
  res.status(204).send();
});

export default router;
