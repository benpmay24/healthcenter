import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useModal } from '../context/ModalContext';
import DayTotals from '../components/DayTotals';
import MealCard from '../components/MealCard';
import WeightForm from '../components/WeightForm';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DayLog() {
  const { date: paramDate } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState(paramDate || todayStr());
  const [meals, setMeals] = useState([]);
  const [totals, setTotals] = useState(null);
  const [weight, setWeight] = useState(null);
  const [savedMeals, setSavedMeals] = useState([]);
  const [mealsDropOver, setMealsDropOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (paramDate && paramDate !== date) setDate(paramDate);
  }, [paramDate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [mealsRes, totalsRes, weightRes, savedRes, settingsRes] = await Promise.all([
          api.getMeals(date),
          api.getTotals(date),
          api.getWeight(date),
          api.getSavedMeals(),
          api.getSettings(),
        ]);
        if (!cancelled) {
          setMeals(mealsRes);
          setTotals(totalsRes);
          setWeight(weightRes);
          setSavedMeals(savedRes || []);
          setSettings(settingsRes);
        }
      } catch (e) {
        if (!cancelled) setMeals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [date]);

  const refresh = async () => {
    const [mealsRes, totalsRes, weightRes, savedRes, settingsRes] = await Promise.all([
      api.getMeals(date),
      api.getTotals(date),
      api.getWeight(date),
      api.getSavedMeals(),
      api.getSettings(),
    ]);
    setMeals(mealsRes);
    setTotals(totalsRes);
    setWeight(weightRes);
    setSavedMeals(savedRes || []);
    setSettings(settingsRes);
  };

  const handleSavedMealDrop = async (e) => {
    e.preventDefault();
    setMealsDropOver(false);
    const id = e.dataTransfer.getData('application/x-saved-meal') || (() => {
      try {
        const j = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
        return j.type === 'saved_meal' ? j.id : null;
      } catch (_) { return null; }
    })();
    if (!id) return;
    try {
      await api.addSavedMealToDay(Number(id), date);
      await refresh();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const { showAlert } = useModal();
  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    navigate(`/day/${d}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="page-header">
        <h1>Daily log</h1>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Daily log</h1>
        <p>Log meals and weight for any day</p>
      </div>

      <div className="grid grid--sidebar">
        <aside className="sidebar-panel">
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2>Date</h2>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label htmlFor="day-date">Select day</label>
              <input
                id="day-date"
                type="date"
                value={date}
                onChange={handleDateChange}
              />
            </div>
          </div>
          <WeightForm date={date} initialWeight={weight} onSave={refresh} />
          {totals && (totals.calories > 0 || totals.protein > 0) && (
            <div style={{ marginTop: 24 }}>
              <DayTotals totals={totals} goals={settings} />
            </div>
          )}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h2>Saved meals</h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Drag a meal into the Meals area to add it to this day.
            </p>
            {savedMeals.length === 0 ? (
              <p className="empty-state">No saved meals. Save a meal as template from a meal card.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 240, overflowY: 'auto' }}>
                {savedMeals.map((sm) => (
                  <li
                    key={sm.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-saved-meal', String(sm.id));
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'saved_meal', id: sm.id }));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    style={{
                      padding: '10px 12px',
                      marginBottom: 6,
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'grab',
                      fontSize: '0.875rem',
                    }}
                  >
                    <strong>{sm.name}</strong>
                    {sm.ingredients?.length > 0 && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.8125rem' }}>
                        {sm.ingredients.length} ingredient{sm.ingredients.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setMealsDropOver(e.dataTransfer.types.includes('application/x-saved-meal'));
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setMealsDropOver(false);
          }}
          onDrop={handleSavedMealDrop}
          style={{
            minHeight: 200,
            borderRadius: 'var(--radius)',
            transition: 'background 0.15s, box-shadow 0.15s',
            ...(mealsDropOver ? { background: 'var(--accent-bg)', boxShadow: 'inset 0 0 0 2px var(--accent)' } : {}),
          }}
        >
          <div className="card">
            <div className="card-header">
              <h2>Meals</h2>
              <AddMealButton date={date} onAdded={refresh} />
            </div>
            {meals.length === 0 && !mealsDropOver ? (
              <p className="empty-state">No meals yet. Add a meal or drag a saved meal here.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    date={date}
                    onUpdate={refresh}
                  />
                ))}
                {mealsDropOver && (
                  <p style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 500, padding: 16, margin: 0 }}>
                    Drop saved meal here
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AddMealButton({ date, onAdded }) {
  const { showAlert } = useModal();
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState('new');
  const [name, setName] = useState('');
  const [savedMeals, setSavedMeals] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const loadSavedMeals = async () => {
    setLoadingSaved(true);
    try {
      const list = await api.getSavedMeals();
      setSavedMeals(list);
    } catch (e) {
      setSavedMeals([]);
    } finally {
      setLoadingSaved(false);
    }
  };

  const openAdd = () => {
    setAdding(true);
    setTab('new');
    setName('');
    if (tab === 'saved') loadSavedMeals();
  };

  const switchToSaved = () => {
    setTab('saved');
    loadSavedMeals();
  };

  const submitNew = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createMeal(date, name.trim());
      setName('');
      setAdding(false);
      onAdded();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const addSavedToDay = async (savedMealId) => {
    try {
      await api.addSavedMealToDay(savedMealId, date);
      setAdding(false);
      onAdded();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  if (!adding) {
    return (
      <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
        + Add meal
      </button>
    );
  }
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'new' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('new')}
        >
          New meal
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'saved' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={switchToSaved}
        >
          Saved meals
        </button>
      </div>
      {tab === 'new' && (
        <form onSubmit={submitNew} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ marginBottom: 0, minWidth: 180 }}>
            <label htmlFor="new-meal-name">Meal name</label>
            <input
              id="new-meal-name"
              type="text"
              placeholder="e.g. Breakfast"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setName(''); }}>
            Cancel
          </button>
        </form>
      )}
      {tab === 'saved' && (
        <div>
          {loadingSaved ? (
            <p className="empty-state">Loading…</p>
          ) : savedMeals.length === 0 ? (
            <p className="empty-state">No saved meals yet. Create a meal and use “Save as template” to save it.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {savedMeals.map((sm) => (
                <li
                  key={sm.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <span>
                    <strong>{sm.name}</strong>
                    {sm.ingredients?.length > 0 && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.875rem' }}>
                        {sm.ingredients.length} ingredient{sm.ingredients.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => addSavedToDay(sm.id)}
                  >
                    Add to day
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
