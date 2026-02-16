import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get(['', '/'], async (req, res) => {
  const routines = await db.all('SELECT * FROM routines ORDER BY name');
  const withExercises = await Promise.all(
    routines.map(async (r) => {
      const items = await db.all(
        `SELECT re.id, re.reps, re.sort_order, e.name, e.category
        FROM routine_exercises re
        JOIN exercises e ON e.id = re.exercise_id
        WHERE re.routine_id = ?
        ORDER BY re.sort_order, re.id`,
        r.id
      );
      return { ...r, exercises: items };
    })
  );
  res.json(withExercises);
});

router.get('/:id', async (req, res) => {
  const r = await db.get('SELECT * FROM routines WHERE id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Routine not found' });
  const exercises = await db.all(
    `SELECT re.id, re.reps, re.sort_order, re.exercise_id, e.name, e.category
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.sort_order, re.id`,
    r.id
  );
  res.json({ ...r, exercises });
});

router.post(['', '/'], async (req, res) => {
  const { name, exercises } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  await db.run('INSERT INTO routines (name) VALUES (?)', name.trim());
  const routine = await db.get('SELECT * FROM routines ORDER BY id DESC LIMIT 1');
  for (let i = 0; i < (exercises || []).length; i++) {
    const item = exercises[i];
    if (item.exercise_id != null) {
      await db.run('INSERT INTO routine_exercises (routine_id, exercise_id, reps, sort_order) VALUES (?, ?, ?, ?)', routine.id, item.exercise_id, Number(item.reps) || 0, i);
    }
  }
  const exercisesList = await db.all(
    `SELECT re.id, re.reps, re.sort_order, e.name, e.category
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.sort_order`,
    routine.id
  );
  res.status(201).json({ ...routine, exercises: exercisesList });
});

router.patch('/:id', async (req, res) => {
  const r = await db.get('SELECT * FROM routines WHERE id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Routine not found' });
  const { name, exercises } = req.body;
  if (name?.trim()) await db.run('UPDATE routines SET name = ? WHERE id = ?', name.trim(), r.id);
  if (Array.isArray(exercises)) {
    await db.run('DELETE FROM routine_exercises WHERE routine_id = ?', r.id);
    for (let i = 0; i < exercises.length; i++) {
      const item = exercises[i];
      if (item.exercise_id != null) await db.run('INSERT INTO routine_exercises (routine_id, exercise_id, reps, sort_order) VALUES (?, ?, ?, ?)', r.id, item.exercise_id, Number(item.reps) || 0, i);
    }
  }
  const routine = await db.get('SELECT * FROM routines WHERE id = ?', r.id);
  const exercisesList = await db.all(
    `SELECT re.id, re.reps, re.sort_order, e.name, e.category
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.sort_order`,
    r.id
  );
  res.json({ ...routine, exercises: exercisesList });
});

router.delete('/:id', async (req, res) => {
  const r = await db.get('SELECT * FROM routines WHERE id = ?', req.params.id);
  if (!r) return res.status(404).json({ error: 'Routine not found' });
  await db.run('DELETE FROM routine_exercises WHERE routine_id = ?', r.id);
  await db.run('DELETE FROM routines WHERE id = ?', r.id);
  res.status(204).send();
});

export default router;
