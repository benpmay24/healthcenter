import { Router } from 'express';
import db from '../db.js';

const KG_TO_LBS = 2.20462262185;

function toLbs(kg) {
  return Math.round(kg * KG_TO_LBS * 100) / 100;
}

const router = Router();

router.get('/', (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM weight_log';
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
  const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
  res.json(rows.map((r) => ({ ...r, weight_lbs: toLbs(r.weight_kg) })));
});

router.get('/:date', (req, res) => {
  const row = db.prepare('SELECT * FROM weight_log WHERE date = ?').get(req.params.date);
  if (!row) return res.status(404).json({ error: 'No weight for this date' });
  res.json({ ...row, weight_lbs: toLbs(row.weight_kg) });
});

router.post('/', (req, res) => {
  const { date, weight_lbs } = req.body;
  if (!date || weight_lbs == null) {
    return res.status(400).json({ error: 'date and weight_lbs required' });
  }
  const lbs = Number(weight_lbs);
  if (Number.isNaN(lbs) || lbs <= 0) {
    return res.status(400).json({ error: 'weight_lbs must be a positive number' });
  }
  const weight_kg = Math.round((lbs / KG_TO_LBS) * 1000) / 1000;
  const existing = db.prepare('SELECT * FROM weight_log WHERE date = ?').get(date);
  if (existing) {
    db.prepare('UPDATE weight_log SET weight_kg = ? WHERE date = ?').run(weight_kg, date);
    const row = db.prepare('SELECT * FROM weight_log WHERE date = ?').get(date);
    return res.json({ ...row, weight_lbs: toLbs(row.weight_kg) });
  }
  db.prepare('INSERT INTO weight_log (date, weight_kg) VALUES (?, ?)').run(date, weight_kg);
  const row = db.prepare('SELECT * FROM weight_log WHERE date = ?').get(date);
  res.status(201).json({ ...row, weight_lbs: toLbs(row.weight_kg) });
});

router.delete('/:date', (req, res) => {
  const r = db.prepare('DELETE FROM weight_log WHERE date = ?').run(req.params.date);
  if (r.changes === 0) return res.status(404).json({ error: 'No weight for this date' });
  res.status(204).send();
});

export default router;
