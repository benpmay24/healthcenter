import { useState } from 'react';

export default function ManualNutrientForm({ onSubmit, onCancel, saveForLaterLabel, onSaveForLater }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [saveForLater, setSaveForLater] = useState(false);

  const getData = () => ({
    name: name.trim(),
    calories: parseFloat(calories) || 0,
    protein: parseFloat(protein) || 0,
    carbs: parseFloat(carbs) || 0,
    fat: parseFloat(fat) || 0,
    fiber: parseFloat(fiber) || 0,
    sodium: sodium === '' ? null : parseFloat(sodium),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data = getData();
    onSubmit(data);
    if (saveForLater && onSaveForLater) onSaveForLater(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="manual-name">Food name *</label>
        <input
          id="manual-name"
          type="text"
          placeholder="e.g. Homemade smoothie"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
        <div className="input-group">
          <label>Calories</label>
          <input type="number" min="0" step="1" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Protein (g)</label>
          <input type="number" min="0" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Carbs (g)</label>
          <input type="number" min="0" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Fat (g)</label>
          <input type="number" min="0" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Fiber (g)</label>
          <input type="number" min="0" step="0.1" value={fiber} onChange={(e) => setFiber(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Sodium (mg)</label>
          <input type="number" min="0" step="1" value={sodium} onChange={(e) => setSodium(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      {onSaveForLater && (
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={saveForLater}
              onChange={(e) => setSaveForLater(e.target.checked)}
            />
            {saveForLaterLabel || 'Save for later (saved ingredients)'}
          </label>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="submit" className="btn btn-primary">Add ingredient</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
