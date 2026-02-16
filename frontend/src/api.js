// In production, set VITE_API_URL to your API origin (e.g. https://api.example.com).
// Leave unset for same-origin /api or when using a reverse proxy.
const API = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    if (data.rateLimit) err.rateLimit = true;
    throw err;
  }
  return data;
}

export const api = {
  getMeals(date) {
    return request(`/meals?date=${encodeURIComponent(date)}`);
  },
  createMeal(date, name) {
    return request('/meals', { method: 'POST', body: JSON.stringify({ date, name }) });
  },
  updateMeal(id, name) {
    return request(`/meals/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
  },
  deleteMeal(id) {
    return request(`/meals/${id}`, { method: 'DELETE' });
  },
  addIngredient(mealId, body) {
    return request(`/meals/${mealId}/ingredients`, { method: 'POST', body: JSON.stringify(body) });
  },
  deleteIngredient(mealId, ingredientId) {
    return request(`/meals/${mealId}/ingredients/${ingredientId}`, { method: 'DELETE' });
  },
  getTotals(date) {
    return request(`/totals/${date}`);
  },
  searchFoods(q) {
    return request(`/foods/search?q=${encodeURIComponent(q)}`);
  },
  getFood(fdcId) {
    return request(`/foods/${fdcId}`);
  },
  getWeight(date) {
    return request(`/weight/${date}`).catch(() => null);
  },
  setWeight(date, weight_lbs) {
    return request('/weight', { method: 'POST', body: JSON.stringify({ date, weight_lbs }) });
  },
  deleteWeight(date) {
    return request(`/weight/${date}`, { method: 'DELETE' });
  },
  getWeightTrend(from, to) {
    return request(`/trends/weight?from=${from}&to=${to}`);
  },
  getMacrosTrend(from, to) {
    return request(`/trends/macros?from=${from}&to=${to}`);
  },
  getSavedMeals() {
    return request('/saved-meals');
  },
  addSavedMealToDay(savedMealId, date) {
    return request(`/saved-meals/${savedMealId}/add-to-day`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },
  saveMealAsTemplate(name, ingredients) {
    return request('/saved-meals', {
      method: 'POST',
      body: JSON.stringify({ name, ingredients }),
    });
  },
  deleteSavedMeal(id) {
    return request(`/saved-meals/${id}`, { method: 'DELETE' });
  },
  getSavedIngredients() {
    return request('/saved-ingredients');
  },
  saveIngredient(body) {
    return request('/saved-ingredients', { method: 'POST', body: JSON.stringify(body) });
  },
  deleteSavedIngredient(id) {
    return request(`/saved-ingredients/${id}`, { method: 'DELETE' });
  },
  getExercises() {
    return request('/exercises');
  },
  createExercise(body) {
    return request('/exercises', { method: 'POST', body: JSON.stringify(body) });
  },
  updateExercise(id, body) {
    return request(`/exercises/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  },
  deleteExercise(id) {
    return request(`/exercises/${id}`, { method: 'DELETE' });
  },
  getRoutines() {
    return request('/routines');
  },
  createRoutine(name, exercises) {
    return request('/routines', { method: 'POST', body: JSON.stringify({ name, exercises }) });
  },
  updateRoutine(id, body) {
    return request(`/routines/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  },
  deleteRoutine(id) {
    return request(`/routines/${id}`, { method: 'DELETE' });
  },
  getScheduledWorkouts(params) {
    const q = params.date ? `date=${params.date}` : `from=${params.from}&to=${params.to}`;
    return request(`/scheduled-workouts?${q}`);
  },
  addScheduledExercise(date, exercise_name, category, reps) {
    return request('/scheduled-workouts', {
      method: 'POST',
      body: JSON.stringify({ date, exercise_name, category, reps }),
    });
  },
  addRoutineToDay(date, routine_id) {
    return request('/scheduled-workouts/from-routine', {
      method: 'POST',
      body: JSON.stringify({ date, routine_id }),
    });
  },
  deleteScheduledWorkout(id) {
    return request(`/scheduled-workouts/${id}`, { method: 'DELETE' });
  },
  getSettings() {
    return request('/settings');
  },
  updateSettings(body) {
    return request('/settings', { method: 'PUT', body: JSON.stringify(body) });
  },
};
