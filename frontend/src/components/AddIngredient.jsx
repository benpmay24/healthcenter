import { useState, useEffect } from 'react';
import { api } from '../api';
import { useModal } from '../context/ModalContext';
import FoodSearch from './FoodSearch';
import ManualNutrientForm from './ManualNutrientForm';

function SavedIngredientsList({ loading, ingredients, onAdd, onRefresh, onCancel, showAlert }) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveNew = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value.trim(),
      calories: parseFloat(form.calories.value) || 0,
      protein: parseFloat(form.protein.value) || 0,
      carbs: parseFloat(form.carbs.value) || 0,
      fat: parseFloat(form.fat.value) || 0,
      fiber: parseFloat(form.fiber.value) || 0,
      sodium: form.sodium.value === '' ? null : parseFloat(form.sodium.value),
    };
    if (!data.name) return;
    setSaving(true);
    try {
      await api.saveIngredient(data);
      setShowSaveForm(false);
      onRefresh();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : ingredients.length === 0 && !showSaveForm ? (
        <p className="empty-state">No saved ingredients. Use “Enter manually” and check “Save for later”, or add one below.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
          {ingredients.map((ing) => (
            <li
              key={ing.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'var(--bg)',
                borderRadius: 8,
                marginBottom: 8,
                border: '1px solid var(--border)',
              }}
            >
              <span>
                <strong>{ing.name}</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.9rem' }}>
                  {Math.round(Number(ing.calories) || 0)} cal · {Number(ing.protein || 0).toFixed(0)}g P
                </span>
              </span>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onAdd(ing)}>
                Add to meal
              </button>
            </li>
          ))}
        </ul>
      )}
      {showSaveForm ? (
        <form onSubmit={handleSaveNew} style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Save new ingredient</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Name *</label>
              <input name="name" type="text" required placeholder="e.g. Oatmeal" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Cal</label>
              <input name="calories" type="number" min="0" defaultValue="0" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>P (g)</label>
              <input name="protein" type="number" min="0" step="0.1" defaultValue="0" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>C (g)</label>
              <input name="carbs" type="number" min="0" step="0.1" defaultValue="0" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>F (g)</label>
              <input name="fat" type="number" min="0" step="0.1" defaultValue="0" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Fiber (g)</label>
              <input name="fiber" type="number" min="0" step="0.1" defaultValue="0" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Sodium (mg)</label>
              <input name="sodium" type="number" min="0" placeholder="Optional" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSaveForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }} onClick={() => setShowSaveForm(true)}>
          + Save new ingredient
        </button>
      )}
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

export default function AddIngredient({ mealId, onAdded, onCancel }) {
  const { showAlert } = useModal();
  const [mode, setMode] = useState('search'); // 'search' | 'manual' | 'saved'
  const [savedIngredients, setSavedIngredients] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const loadSavedIngredients = () => {
    setLoadingSaved(true);
    api.getSavedIngredients()
      .then(setSavedIngredients)
      .catch(() => setSavedIngredients([]))
      .finally(() => setLoadingSaved(false));
  };

  useEffect(() => {
    if (mode === 'saved') loadSavedIngredients();
  }, [mode]);

  const handleSelectFood = async (food, quantity = 1, servingGrams = null) => {
    const name = [food.description, food.brandName, food.brandOwner].filter(Boolean).join(', ') || food.description;
    const body = {
      name: name.slice(0, 200),
      fdc_id: food.fdcId,
      quantity,
      serving_grams: servingGrams ?? food.servingSize ?? 100,
      calories: food.calories ?? 0,
      protein: food.protein ?? 0,
      carbs: food.carbs ?? 0,
      fat: food.fat ?? 0,
      fiber: food.fiber ?? 0,
      sodium: food.sodium != null ? food.sodium : null,
    };
    try {
      await api.addIngredient(mealId, body);
      onAdded();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const handleManualSubmit = async (data) => {
    try {
      await api.addIngredient(mealId, {
        name: data.name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber,
        sodium: data.sodium || null,
      });
      onAdded();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const addSavedIngredient = async (ing) => {
    try {
      await api.addIngredient(mealId, {
        name: ing.name,
        fdc_id: ing.fdc_id,
        quantity: ing.quantity,
        serving_grams: ing.serving_grams,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        fiber: ing.fiber,
        sodium: ing.sodium,
      });
      onAdded();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn-sm ${mode === 'search' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('search')}
        >
          Search food
        </button>
        <button
          type="button"
          className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('manual')}
        >
          Enter manually
        </button>
        <button
          type="button"
          className={`btn btn-sm ${mode === 'saved' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('saved')}
        >
          Saved ingredients
        </button>
      </div>
      {mode === 'search' && (
        <>
          <FoodSearch onSelect={handleSelectFood} />
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={onCancel}>
            Cancel
          </button>
        </>
      )}
      {mode === 'manual' && (
        <ManualNutrientForm
          onSubmit={handleManualSubmit}
          onCancel={onCancel}
          onSaveForLater={async (data) => {
            try {
              await api.saveIngredient(data);
            } catch (err) {
              showAlert(err.message, { variant: 'error', title: 'Error' });
            }
          }}
        />
      )}
      {mode === 'saved' && (
        <SavedIngredientsList
          loading={loadingSaved}
          ingredients={savedIngredients}
          onAdd={addSavedIngredient}
          onRefresh={loadSavedIngredients}
          onCancel={onCancel}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}
