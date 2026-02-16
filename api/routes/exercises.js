import { Router } from 'express';
import db from '../db.js';

const CATEGORIES = ['chest', 'biceps', 'triceps', 'back', 'abs', 'shoulders', 'legs'];

const router = Router();

router.get(['', '/'], (req, res) => {
  const rows = db.prepare('SELECT * FROM exercises ORDER BY category, name').all();
  res.json(rows);
});

router.post(['', '/'], (req, res) => {
  const { name, category, default_reps } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  if (!category || !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }
  db.prepare('INSERT INTO exercises (name, category, default_reps) VALUES (?, ?, ?)').run(
    name.trim(),
    category,
    default_reps != null ? Number(default_reps) : null
  );
  const row = db.prepare('SELECT * FROM exercises ORDER BY id DESC LIMIT 1').get();
  res.status(201).json(row);
});

router.patch('/:id', (req, res) => {
  const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  const { name, category, default_reps } = req.body;
  if (name?.trim()) db.prepare('UPDATE exercises SET name = ? WHERE id = ?').run(name.trim(), ex.id);
  if (category && CATEGORIES.includes(category)) db.prepare('UPDATE exercises SET category = ? WHERE id = ?').run(category, ex.id);
  if (default_reps !== undefined) db.prepare('UPDATE exercises SET default_reps = ? WHERE id = ?').run(default_reps == null ? null : Number(default_reps), ex.id);
  const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(ex.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  db.prepare('DELETE FROM routine_exercises WHERE exercise_id = ?').run(ex.id);
  db.prepare('DELETE FROM exercises WHERE id = ?').run(ex.id);
  res.status(204).send();
});

export default router;
export { CATEGORIES };
