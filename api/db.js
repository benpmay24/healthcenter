import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import pg from 'pg';
import { createPgAdapter } from './lib/pg-adapter.js';
import { createSqliteAdapter } from './lib/sqlite-adapter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS meal_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    fdc_id INTEGER,
    quantity REAL NOT NULL DEFAULT 1,
    serving_grams REAL,
    calories REAL NOT NULL DEFAULT 0,
    protein REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    fat REAL NOT NULL DEFAULT 0,
    fiber REAL NOT NULL DEFAULT 0,
    sodium REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS weight_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    weight_kg REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS saved_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS saved_meal_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saved_meal_id INTEGER NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    fdc_id INTEGER,
    quantity REAL NOT NULL DEFAULT 1,
    serving_grams REAL,
    calories REAL NOT NULL DEFAULT 0,
    protein REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    fat REAL NOT NULL DEFAULT 0,
    fiber REAL NOT NULL DEFAULT 0,
    sodium REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS saved_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fdc_id INTEGER,
    quantity REAL NOT NULL DEFAULT 1,
    serving_grams REAL,
    calories REAL NOT NULL DEFAULT 0,
    protein REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    fat REAL NOT NULL DEFAULT 0,
    fiber REAL NOT NULL DEFAULT 0,
    sodium REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    default_reps INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS routine_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    reps INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS scheduled_workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    category TEXT NOT NULL,
    reps INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
  CREATE INDEX IF NOT EXISTS idx_meal_ingredients_meal ON meal_ingredients(meal_id);
  CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_log(date);
  CREATE INDEX IF NOT EXISTS idx_saved_meal_ingredients_saved_meal ON saved_meal_ingredients(saved_meal_id);
  CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routine_id);
  CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_date ON scheduled_workouts(date);
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    height_cm REAL,
    goal_calories REAL,
    goal_protein REAL,
    goal_carbs REAL,
    goal_fat REAL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
  INSERT OR IGNORE INTO user_settings (id) VALUES (1);
`;

async function initDb() {
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const schemaPath = join(__dirname, 'schema-postgres.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      await pool.query(stmt + ';');
    }
    return createPgAdapter(pool);
  }
  const sqlitePath = join(__dirname, 'health.db');
  const sqliteDb = new Database(sqlitePath);
  sqliteDb.exec(SQLITE_SCHEMA);
  return createSqliteAdapter(sqliteDb);
}

const dbPromise = initDb();

const db = {
  async get(sql, ...params) {
    const adapter = await dbPromise;
    return adapter.get(sql, ...params);
  },
  async all(sql, ...params) {
    const adapter = await dbPromise;
    return adapter.all(sql, ...params);
  },
  async run(sql, ...params) {
    const adapter = await dbPromise;
    return adapter.run(sql, ...params);
  },
};

export default db;
export { dbPromise };
