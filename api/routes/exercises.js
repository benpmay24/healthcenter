import { Router } from 'express';
import db from '../db.js';

const CATEGORIES = ['chest', 'biceps', 'triceps', 'back', 'abs', 'shoulders', 'legs'];

const router = Router();

router.get(['', '/'], async (req, res) => {
  const rows = await db.all('SELECT * FROM exercises ORDER BY category, name');
  res.json(rows);
});

router.post(['', '/'], async (req, res) => {
  const { name, category, default_reps } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  if (!category || !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }
  await db.run('INSERT INTO exercises (name, category, default_reps) VALUES (?, ?, ?)', name.trim(), category, default_reps != null ? Number(default_reps) : null);
  const row = await db.get('SELECT * FROM exercises ORDER BY id DESC LIMIT 1');
  res.status(201).json(row);
});

router.patch('/:id', async (req, res) => {
  const ex = await db.get('SELECT * FROM exercises WHERE id = ?', req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  const { name, category, default_reps } = req.body;
  if (name?.trim()) await db.run('UPDATE exercises SET name = ? WHERE id = ?', name.trim(), ex.id);
  if (category && CATEGORIES.includes(category)) await db.run('UPDATE exercises SET category = ? WHERE id = ?', category, ex.id);
  if (default_reps !== undefined) await db.run('UPDATE exercises SET default_reps = ? WHERE id = ?', default_reps == null ? null : Number(default_reps), ex.id);
  const row = await db.get('SELECT * FROM exercises WHERE id = ?', ex.id);
  res.json(row);
});

router.delete('/:id', async (req, res) => {
  const ex = await db.get('SELECT * FROM exercises WHERE id = ?', req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  await db.run('DELETE FROM routine_exercises WHERE exercise_id = ?', ex.id);
  await db.run('DELETE FROM exercises WHERE id = ?', ex.id);
  res.status(204).send();
});

export default router;
export { CATEGORIES };
