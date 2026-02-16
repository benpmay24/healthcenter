import { useState } from 'react';
import { api } from '../api';
import { useModal } from '../context/ModalContext';
import AddIngredient from './AddIngredient';

export default function MealCard({ meal, date, onUpdate }) {
  const { showAlert, showConfirm } = useModal();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(meal.name);
  const [addingIngredient, setAddingIngredient] = useState(false);

  const saveName = async () => {
    if (name.trim() === meal.name) {
      setEditingName(false);
      return;
    }
    try {
      await api.updateMeal(meal.id, name.trim());
      setEditingName(false);
      onUpdate();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const deleteMeal = async () => {
    const ok = await showConfirm(`Delete "${meal.name}" and all its ingredients?`, { title: 'Delete meal', confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true });
    if (!ok) return;
    try {
      await api.deleteMeal(meal.id);
      onUpdate();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const deleteIngredient = async (ingredientId) => {
    try {
      await api.deleteIngredient(meal.id, ingredientId);
      onUpdate();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const mealCalories = meal.ingredients.reduce((s, i) => s + (Number(i.calories) || 0), 0);
  const mealProtein = meal.ingredients.reduce((s, i) => s + (Number(i.protein) || 0), 0);

  const saveAsTemplate = async () => {
    try {
      await api.saveMealAsTemplate(meal.name, meal.ingredients.map((i) => ({
        name: i.name,
        fdc_id: i.fdc_id,
        quantity: i.quantity,
        serving_grams: i.serving_grams,
        calories: i.calories,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat,
        fiber: i.fiber,
        sodium: i.sodium,
      })));
      onUpdate();
      showAlert('Meal saved as template. You can add it from “Add meal” → “Saved meals”.', { variant: 'success', title: 'Saved' });
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        {editingName ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', width: 180 }}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingName(false); setName(meal.name); }}>Cancel</button>
          </div>
        ) : (
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>
            {meal.name}
            {meal.ingredients.length > 0 && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: 8 }}>
                {Math.round(mealCalories)} cal · {mealProtein.toFixed(0)}g P
              </span>
            )}
          </h2>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {!editingName && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingName(true)}>Rename</button>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddingIngredient(true)}>
            + Add ingredient
          </button>
          {meal.ingredients.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={saveAsTemplate}>
              Save as template
            </button>
          )}
          <button type="button" className="btn btn-danger btn-sm" onClick={deleteMeal}>Delete</button>
        </div>
      </div>

      {meal.ingredients.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
          {meal.ingredients.map((ing) => (
            <li
              key={ing.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bg)',
                borderRadius: 6,
                marginBottom: 6,
                border: '1px solid var(--border)',
              }}
            >
              <span>
                <strong>{ing.name}</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.9rem' }}>
                  {Number(ing.quantity) !== 1 && `${ing.quantity}× · `}
                  {Math.round(Number(ing.calories) || 0)} cal
                  {ing.protein > 0 && ` · ${Number(ing.protein).toFixed(0)}g P`}
                </span>
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => deleteIngredient(ing.id)}
                aria-label="Remove ingredient"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {addingIngredient && (
        <AddIngredient
          mealId={meal.id}
          onAdded={() => { setAddingIngredient(false); onUpdate(); }}
          onCancel={() => setAddingIngredient(false)}
        />
      )}
    </div>
  );
}
