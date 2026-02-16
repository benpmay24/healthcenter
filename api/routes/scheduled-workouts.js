import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get(['', '/'], (req, res) => {
  const { date, from, to } = req.query;
  if (date) {
    const rows = db.prepare('SELECT * FROM scheduled_workouts WHERE date = ? ORDER BY sort_order, id').all(date);
    return res.json(rows);
  }
  if (from && to) {
    const rows = db.prepare('SELECT * FROM scheduled_workouts WHERE date >= ? AND date <= ? ORDER BY date, sort_order, id').all(from, to);
    return res.json(rows);
  }
  return res.status(400).json({ error: 'Provide date or from+to' });
});

router.post(['', '/'], (req, res) => {
  const { date, exercise_name, category, reps } = req.body;
  if (!date || !exercise_name?.trim()) return res.status(400).json({ error: 'date and exercise_name required' });
  const categoryVal = category || 'other';
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as n FROM scheduled_workouts WHERE date = ?').get(date);
  db.prepare(`
    INSERT INTO scheduled_workouts (date, exercise_name, category, reps, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(date, exercise_name.trim(), categoryVal, Number(reps) || 0, maxOrder.n);
  const row = db.prepare('SELECT * FROM scheduled_workouts WHERE date = ? ORDER BY id DESC LIMIT 1').get(date);
  res.status(201).json(row);
});

router.post('/from-routine', (req, res) => {
  const { date, routine_id } = req.body;
  if (!date || !routine_id) return res.status(400).json({ error: 'date and routine_id required' });
  const exercises = db.prepare(`
    SELECT e.name, e.category, re.reps
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.sort_order, re.id
  `).all(routine_id);
  if (exercises.length === 0) return res.status(400).json({ error: 'Routine has no exercises' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as n FROM scheduled_workouts WHERE date = ?').get(date);
  let order = (maxOrder?.n ?? -1) + 1;
  const insert = db.prepare(`
    INSERT INTO scheduled_workouts (date, exercise_name, category, reps, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const ex of exercises) {
    insert.run(date, ex.name, ex.category, ex.reps, order++);
  }
  const rows = db.prepare('SELECT * FROM scheduled_workouts WHERE date = ? ORDER BY sort_order, id').all(date);
  res.status(201).json(rows);
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM scheduled_workouts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Scheduled workout not found' });
  db.prepare('DELETE FROM scheduled_workouts WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
