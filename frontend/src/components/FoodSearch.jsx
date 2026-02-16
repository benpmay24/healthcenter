import { useState } from 'react';
import { api } from '../api';
import { useModal } from '../context/ModalContext';

export default function FoodSearch({ onSelect }) {
  const { showAlert } = useModal();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [servingGrams, setServingGrams] = useState('');
  const [rateLimitMessage, setRateLimitMessage] = useState(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setResults([]);
    setSelected(null);
    setRateLimitMessage(null);
    try {
      const { foods } = await api.searchFoods(q);
      setResults(foods);
    } catch (err) {
      const msg = err.message || 'Search failed';
      if (err.rateLimit || /rate limit/i.test(msg)) {
        setRateLimitMessage(msg);
      } else {
        showAlert(msg, { variant: 'error', title: 'Search failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const pick = (food) => {
    setSelected(food);
    setServingGrams(String(food.servingSize ?? 100));
    setQuantity(1);
  };

  const confirmAdd = () => {
    if (!selected) return;
    const mult = parseFloat(quantity) || 1;
    const grams = parseFloat(servingGrams);
    const scale = Number.isNaN(grams) || grams <= 0 ? 1 : (grams / (selected.servingSize || 100)) * mult;
    onSelect(
      {
        ...selected,
        calories: (selected.calories || 0) * scale,
        protein: (selected.protein || 0) * scale,
        carbs: (selected.carbs || 0) * scale,
        fat: (selected.fat || 0) * scale,
        fiber: (selected.fiber || 0) * scale,
        sodium: selected.sodium != null ? (selected.sodium || 0) * scale : null,
      },
      scale,
      Number.isNaN(grams) ? null : grams * mult
    );
  };

  return (
    <div>
      {rateLimitMessage && (
        <div
          style={{
            padding: 12,
            marginBottom: 10,
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: '0.875rem',
            color: 'var(--text)',
          }}
        >
          {rateLimitMessage}
          <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Use the <strong>Enter manually</strong> tab to add this food, or add a free API key in <code style={{ fontSize: '0.8rem' }}>api/.env</code> (see README).
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          type="search"
          placeholder="Search foods or brands…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
          }}
        />
        <button type="button" className="btn btn-primary" onClick={search} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {results.length > 0 && !selected && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 240, overflowY: 'auto' }}>
          {results.map((food) => (
            <li
              key={food.fdcId}
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
              }}
              onClick={() => pick(food)}
              onKeyDown={(e) => e.key === 'Enter' && pick(food)}
              role="button"
              tabIndex={0}
            >
              <div style={{ fontWeight: 500 }}>{food.description}</div>
              {(food.brandName || food.brandOwner) && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {[food.brandName, food.brandOwner].filter(Boolean).join(' · ')}
                </div>
              )}
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {Math.round(food.calories || 0)} cal
                {food.servingSize && ` per ${food.servingSize}${food.servingSizeUnit || 'g'}`}
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{selected.description}</strong>
            {(selected.brandName || selected.brandOwner) && (
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                {[selected.brandName, selected.brandOwner].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <div className="macro-grid" style={{ marginBottom: 12 }}>
            <div className="macro-item calories"><span className="value">{Math.round(selected.calories || 0)}</span> <span className="label">cal</span></div>
            <div className="macro-item protein"><span className="value">{selected.protein?.toFixed(1)}g</span> <span className="label">P</span></div>
            <div className="macro-item carbs"><span className="value">{selected.carbs?.toFixed(1)}g</span> <span className="label">C</span></div>
            <div className="macro-item fat"><span className="value">{selected.fat?.toFixed(1)}g</span> <span className="label">F</span></div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, width: 100 }}>
              <label>Quantity</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0, width: 120 }}>
              <label>Serving (g)</label>
              <input
                type="number"
                step="1"
                min="1"
                placeholder={selected.servingSize}
                value={servingGrams}
                onChange={(e) => setServingGrams(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={confirmAdd}>
              Add to meal
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
