import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get(['', '/'], (req, res) => {
  const routines = db.prepare('SELECT * FROM routines ORDER BY name').all();
  const withExercises = routines.map((r) => {
    const items = db.prepare(`
      SELECT re.id, re.reps, re.sort_order, e.name, e.category
      FROM routine_exercises re
      JOIN exercises e ON e.id = re.exercise_id
      WHERE re.routine_id = ?
      ORDER BY re.sort_order, re.id
    `).all(r.id);
    return { ...r, exercises: items };
  });
  res.json(withExercises);
});

router.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Routine not found' });
  const exercises = db.prepare(`
    SELECT re.id, re.reps, re.sort_order, re.exercise_id, e.name, e.category
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.sort_order, re.id
  `).all(r.id);
  res.json({ ...r, exercises });
});

router.post(['', '/'], (req, res) => {
  const { name, exercises } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  db.prepare('INSERT INTO routines (name) VALUES (?)').run(name.trim());
  const routine = db.prepare('SELECT * FROM routines ORDER BY id DESC LIMIT 1').get();
  const insert = db.prepare('INSERT INTO routine_exercises (routine_id, exercise_id, reps, sort_order) VALUES (?, ?, ?, ?)');
  (exercises || []).forEach((item, i) => {
    if (item.exercise_id != null) {
      insert.run(routine.id, item.exercise_id, Number(item.reps) || 0, i);
    }
  });
  const exercisesList = db.prepare(`
    SELECT re.id, re.reps, re.sort_order, e.name, e.category
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.sort_order
  `).all(routine.id);
  res.status(201).json({ ...routine, exercises: exercisesList });
});

router.patch('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Routine not found' });
  const { name, exercises } = req.body;
  if (name?.trim()) db.prepare('UPDATE routines SET name = ? WHERE id = ?').run(name.trim(), r.id);
  if (Array.isArray(exercises)) {
    db.prepare('DELETE FROM routine_exercises WHERE routine_id = ?').run(r.id);
    const insert = db.prepare('INSERT INTO routine_exercises (routine_id, exercise_id, reps, sort_order) VALUES (?, ?, ?, ?)');
    exercises.forEach((item, i) => {
      if (item.exercise_id != null) insert.run(r.id, item.exercise_id, Number(item.reps) || 0, i);
    });
  }
  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(r.id);
  const exercisesList = db.prepare(`
    SELECT re.id, re.reps, re.sort_order, e.name, e.category
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.sort_order
  `).all(r.id);
  res.json({ ...routine, exercises: exercisesList });
});

router.delete('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Routine not found' });
  db.prepare('DELETE FROM routine_exercises WHERE routine_id = ?').run(r.id);
  db.prepare('DELETE FROM routines WHERE id = ?').run(r.id);
  res.status(204).send();
});

export default router;
