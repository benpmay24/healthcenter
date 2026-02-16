import { useState, useEffect } from 'react';
import { api } from '../api';
import { useModal } from '../context/ModalContext';

const CATEGORIES = ['chest', 'biceps', 'triceps', 'back', 'abs', 'shoulders', 'legs'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getUpcomingDays(count = 7) {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function Exercises() {
  const { showAlert } = useModal();
  const [bankTab, setBankTab] = useState('exercises'); // 'exercises' | 'routines'
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [scheduledByDate, setScheduledByDate] = useState({});
  const [days] = useState(() => getUpcomingDays(7));
  const [loading, setLoading] = useState(true);
  const [draggingOver, setDraggingOver] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ex, rot, sched] = await Promise.all([
        api.getExercises(),
        api.getRoutines(),
        api.getScheduledWorkouts({ from: days[0], to: days[days.length - 1] }),
      ]);
      setExercises(ex);
      setRoutines(rot);
      const byDate = {};
      days.forEach((d) => { byDate[d] = []; });
      (sched || []).forEach((w) => {
        if (!byDate[w.date]) byDate[w.date] = [];
        byDate[w.date].push(w);
      });
      setScheduledByDate(byDate);
    } catch (e) {
      showAlert(e?.message || 'Failed to load', { variant: 'error', title: 'Error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDragStart = (e, type, data) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, ...data }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDraggingOver(date);
  };

  const handleDragLeave = () => setDraggingOver(null);

  const addToDate = async (date, payload) => {
    try {
      if (payload.type === 'exercise') {
        await api.addScheduledExercise(
          date,
          payload.name,
          payload.category,
          payload.default_reps ?? 10
        );
      } else if (payload.type === 'routine') {
        await api.addRoutineToDay(date, payload.id);
      }
      await load();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const handleDrop = async (e, date) => {
    e.preventDefault();
    setDraggingOver(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      await addToDate(date, payload);
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  const removeScheduled = async (id) => {
    try {
      await api.deleteScheduledWorkout(id);
      await load();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Exercise planning</h1>
        <p>Drag exercises or routines from the bank onto a day to schedule your workouts.</p>
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : (
        <div className="grid grid--sidebar" style={{ alignItems: 'stretch' }}>
          <aside className="sidebar-panel">
            <div className="card">
              <div className="card-header">
                <h2>Bank</h2>
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${bankTab === 'exercises' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setBankTab('exercises')}
                >
                  Exercises
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${bankTab === 'routines' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setBankTab('routines')}
                >
                  Routines
                </button>
              </div>
              {bankTab === 'exercises' && (
                <ExerciseBank
                  exercises={exercises}
                  todayStr={todayStr()}
                  onDragStart={handleDragStart}
                  onAddToToday={addToDate}
                  onDelete={async (id) => {
                    try {
                      await api.deleteExercise(id);
                      await load();
                    } catch (err) {
                      showAlert(err.message, { variant: 'error', title: 'Error' });
                    }
                  }}
                  onRefresh={load}
                />
              )}
              {bankTab === 'routines' && (
                <RoutineBank
                  routines={routines}
                  exercises={exercises}
                  todayStr={todayStr()}
                  onDragStart={handleDragStart}
                  onAddToToday={addToDate}
                  onDelete={async (id) => {
                    try {
                      await api.deleteRoutine(id);
                      await load();
                    } catch (err) {
                      showAlert(err.message, { variant: 'error', title: 'Error' });
                    }
                  }}
                  onRefresh={load}
                />
              )}
            </div>
          </aside>

          <div>
            <div className="card">
              <div className="card-header">
                <h2>Upcoming days</h2>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Including today — drag items here or use “Add to today”</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {days.map((date) => (
                  <DayDropZone
                    key={date}
                    date={date}
                    items={scheduledByDate[date] || []}
                    isOver={draggingOver === date}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onRemove={removeScheduled}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ExerciseBank({ exercises, todayStr, onDragStart, onAddToToday, onDelete, onRefresh }) {
  const { showAlert, showConfirm } = useModal();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('chest');
  const [reps, setReps] = useState('10');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createExercise({ name: name.trim(), category, default_reps: parseInt(reps, 10) || null });
      setName('');
      setReps('10');
      setAdding(false);
      onRefresh();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  return (
    <div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 320, overflowY: 'auto' }}>
        {exercises.map((ex) => (
          <li
            key={ex.id}
            draggable
            onDragStart={(e) => onDragStart(e, 'exercise', { id: ex.id, name: ex.name, category: ex.category, default_reps: ex.default_reps })}
            style={{
              padding: '10px 12px',
              marginBottom: 6,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'grab',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span>
              <strong>{ex.name}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8, textTransform: 'capitalize' }}>{ex.category}</span>
              {ex.default_reps != null && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{ex.default_reps} reps</span>}
            </span>
            <span style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                title="Add to today"
                onClick={() => onAddToToday(todayStr, { type: 'exercise', id: ex.id, name: ex.name, category: ex.category, default_reps: ex.default_reps })}
              >
                Today
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                title="Delete exercise"
                onClick={async () => {
                  const ok = await showConfirm(`Delete "${ex.name}"?`, { title: 'Delete exercise', confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true });
                  if (ok) onDelete(ex.id);
                }}
              >
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
      {adding ? (
        <form onSubmit={submit} style={{ marginTop: 12 }}>
          <div className="input-group" style={{ marginBottom: 8 }}>
            <input type="text" placeholder="Exercise name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group" style={{ marginBottom: 8 }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 8 }}>
            <input type="number" min="0" placeholder="Default reps" value={reps} onChange={(e) => setReps(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary btn-sm">Add</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Add exercise</button>
      )}
    </div>
  );
}

function RoutineBank({ routines, exercises, todayStr, onDragStart, onAddToToday, onDelete, onRefresh }) {
  const { showAlert, showConfirm } = useModal();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]); // [{ exercise_id, reps }]

  const addRow = () => {
    const first = exercises[0];
    setSelected([...selected, { exercise_id: first?.id, exercise_name: first?.name, reps: first?.default_reps ?? 10 }]);
  };

  const removeRow = (i) => {
    setSelected(selected.filter((_, idx) => idx !== i));
  };

  const updateRow = (i, field, value) => {
    const next = [...selected];
    if (field === 'exercise_id') {
      const ex = exercises.find((e) => e.id === Number(value));
      next[i] = { ...next[i], exercise_id: ex?.id, exercise_name: ex?.name, reps: next[i].reps };
    } else {
      next[i] = { ...next[i], [field]: value };
    }
    setSelected(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || selected.length === 0) return;
    try {
      await api.createRoutine(
        name.trim(),
        selected.map((r) => ({ exercise_id: r.exercise_id, reps: Number(r.reps) || 0 }))
      );
      setName('');
      setSelected([]);
      setAdding(false);
      onRefresh();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    }
  };

  return (
    <div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 320, overflowY: 'auto' }}>
        {routines.map((r) => (
          <li
            key={r.id}
            draggable
            onDragStart={(e) => onDragStart(e, 'routine', { id: r.id, name: r.name })}
            style={{
              padding: '12px 14px',
              marginBottom: 8,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'grab',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span>
              <strong>{r.name}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: 4 }}>
                {r.exercises?.length || 0} exercises
              </div>
            </span>
            <span style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                title="Add to today"
                onClick={() => onAddToToday(todayStr, { type: 'routine', id: r.id, name: r.name })}
              >
                Today
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                title="Delete routine"
                onClick={async () => {
                  const ok = await showConfirm(`Delete routine "${r.name}"?`, { title: 'Delete routine', confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true });
                  if (ok) onDelete(r.id);
                }}
              >
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
      {adding ? (
        <form onSubmit={submit} style={{ marginTop: 12 }}>
          <div className="input-group" style={{ marginBottom: 8 }}>
            <input type="text" placeholder="Routine name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {selected.map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <select
                value={row.exercise_id ?? ''}
                onChange={(e) => updateRow(i, 'exercise_id', e.target.value)}
                style={{ flex: '1 1 120px', minWidth: 0 }}
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <input type="number" min="0" placeholder="Reps" value={row.reps} onChange={(e) => updateRow(i, 'reps', e.target.value)} style={{ width: 70 }} title="Reps" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeRow(i)}>×</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={addRow}>+ Add exercise to routine</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={selected.length === 0}>Save routine</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setSelected([]); }}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          {exercises.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 12 }}>Add exercises first, then create a routine.</p>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Add routine</button>
          )}
        </>
      )}
    </div>
  );
}

function DayDropZone({ date, items, isOver, onDragOver, onDragLeave, onDrop, onRemove }) {
  const isToday = date === new Date().toISOString().slice(0, 10);
  const label = isToday ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div
      onDragOver={(e) => onDragOver(e, date)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, date)}
      style={{
        minHeight: 120,
        padding: 16,
        background: isOver ? 'var(--accent-bg)' : 'var(--surface-elevated)',
        border: `2px ${isOver ? 'dashed var(--accent)' : 'solid var(--border)'}`,
        borderRadius: 'var(--radius)',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9375rem' }}>
        {label}
        {isToday && <span style={{ marginLeft: 6, color: 'var(--accent)', fontSize: '0.75rem' }}>Today</span>}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{date}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((w) => (
          <li
            key={w.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.8125rem',
            }}
          >
            <span>
              <strong>{w.exercise_name}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{w.reps} reps</span>
            </span>
            <button type="button" className="btn btn-ghost btn-sm" style={{ padding: 2 }} onClick={() => onRemove(w.id)} aria-label="Remove">×</button>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Drop here</p>}
    </div>
  );
}
