import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dbPromise } from './db.js';
import mealsRouter from './routes/meals.js';
import ingredientsRouter from './routes/ingredients.js';
import totalsRouter from './routes/totals.js';
import weightRouter from './routes/weight.js';
import foodsRouter from './routes/foods.js';
import trendsRouter from './routes/trends.js';
import savedMealsRouter from './routes/saved-meals.js';
import savedIngredientsRouter from './routes/saved-ingredients.js';
import exercisesRouter from './routes/exercises.js';
import routinesRouter from './routes/routines.js';
import scheduledWorkoutsRouter from './routes/scheduled-workouts.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN } : {}));
app.use(express.json());

app.use('/api/meals', mealsRouter);
app.use('/api/meals/:mealId/ingredients', ingredientsRouter);
app.use('/api/totals', totalsRouter);
app.use('/api/weight', weightRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/saved-meals', savedMealsRouter);
app.use('/api/saved-ingredients', savedIngredientsRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/scheduled-workouts', scheduledWorkoutsRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const start = async () => {
  await dbPromise;
  app.listen(PORT, () => {
    console.log(`Health Center API running at http://localhost:${PORT}`);
    if (process.env.DATABASE_URL) console.log('Using PostgreSQL');
    else console.log('Using SQLite');
  });
};
start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
