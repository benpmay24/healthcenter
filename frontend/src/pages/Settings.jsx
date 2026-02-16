import { useState, useEffect } from 'react';
import { api } from '../api';
import { useModal } from '../context/ModalContext';

export default function Settings() {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [goalCalories, setGoalCalories] = useState('');
  const [goalProtein, setGoalProtein] = useState('');
  const [goalCarbs, setGoalCarbs] = useState('');
  const [goalFat, setGoalFat] = useState('');

  useEffect(() => {
    api.getSettings()
      .then((s) => {
        setHeightCm(s.height_cm != null ? String(s.height_cm) : '');
        setGoalCalories(s.goal_calories != null ? String(s.goal_calories) : '');
        setGoalProtein(s.goal_protein != null ? String(s.goal_protein) : '');
        setGoalCarbs(s.goal_carbs != null ? String(s.goal_carbs) : '');
        setGoalFat(s.goal_fat != null ? String(s.goal_fat) : '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        height_cm: heightCm === '' ? null : parseFloat(heightCm),
        goal_calories: goalCalories === '' ? null : parseFloat(goalCalories),
        goal_protein: goalProtein === '' ? null : parseFloat(goalProtein),
        goal_carbs: goalCarbs === '' ? null : parseFloat(goalCarbs),
        goal_fat: goalFat === '' ? null : parseFloat(goalFat),
      });
      showAlert('Settings saved.', { variant: 'success', title: 'Saved' });
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-header">
        <h1>Settings</h1>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Your profile and daily macro goals. Goals are used on the daily log to compare what you’ve consumed.</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 420 }}>
        <div className="card-header">
          <h2>Profile</h2>
        </div>
        <div className="input-group">
          <label htmlFor="height-cm">Height (cm)</label>
          <input
            id="height-cm"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 175"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
          <p className="form-hint">
            Stored once; not tracked over time.
          </p>
        </div>

        <div className="card-header" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <h2>Daily macro goals</h2>
        </div>
        <p className="form-hint" style={{ margin: '0 0 16px' }}>
          Set targets for each day. Leave blank to hide goal comparison.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="goal-cal">Calories</label>
            <input
              id="goal-cal"
              type="number"
              min="0"
              placeholder="—"
              value={goalCalories}
              onChange={(e) => setGoalCalories(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="goal-protein">Protein (g)</label>
            <input
              id="goal-protein"
              type="number"
              min="0"
              step="0.1"
              placeholder="—"
              value={goalProtein}
              onChange={(e) => setGoalProtein(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="goal-carbs">Carbs (g)</label>
            <input
              id="goal-carbs"
              type="number"
              min="0"
              step="0.1"
              placeholder="—"
              value={goalCarbs}
              onChange={(e) => setGoalCarbs(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="goal-fat">Fat (g)</label>
            <input
              id="goal-fat"
              type="number"
              min="0"
              step="0.1"
              placeholder="—"
              value={goalFat}
              onChange={(e) => setGoalFat(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </>
  );
}
