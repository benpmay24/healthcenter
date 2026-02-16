import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import DayTotals from '../components/DayTotals';
import BMIGauge from '../components/BMIGauge';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [date] = useState(todayStr());
  const [totals, setTotals] = useState(null);
  const [weight, setWeight] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [t, w, workout, settingsRes] = await Promise.all([
          api.getTotals(date),
          api.getWeight(date),
          api.getScheduledWorkouts({ date: todayStr() }),
          api.getSettings(),
        ]);
        if (!cancelled) {
          setTotals(t);
          setWeight(w);
          setTodayWorkout(workout || []);
          setSettings(settingsRes);
        }
      } catch (e) {
        if (!cancelled) setTotals(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [date]);

  const heightM = settings?.height_cm != null ? Number(settings.height_cm) / 100 : null;
  const currentBmi = useMemo(() => {
    if (!weight?.weight_lbs || !heightM || heightM <= 0) return null;
    const weightKg = weight.weight_lbs / 2.20462262185;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  }, [weight, heightM]);

  if (loading) {
    return (
      <div className="hero">
        <h1 className="hero__title">Today</h1>
        <p className="hero__subtitle">Loading…</p>
      </div>
    );
  }

  const hasTotals = totals && (totals.calories > 0 || totals.protein > 0);

  return (
    <>
      <section className="section">
        <div className="hero">
          <h1 className="hero__title">Today</h1>
          <p className="hero__subtitle">
            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="grid grid--2">
          <div className="card">
            <div className="card-header">
              <h2>Daily totals</h2>
              <Link to={`/day/${date}`} className="btn btn-secondary btn-sm">Edit day</Link>
            </div>
            {hasTotals ? (
              <DayTotals totals={totals} goals={settings} embed />
            ) : (
              <p className="empty-state">No meals logged today. <Link to={`/day/${date}`}>Add meals</Link></p>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Weight</h2>
              <Link to={`/day/${date}`} className="btn btn-secondary btn-sm">Edit</Link>
            </div>
            {weight ? (
              <p className="card-value">
                {weight.weight_lbs} lbs
              </p>
            ) : (
              <p className="empty-state">No weight logged. <Link to={`/day/${date}`}>Log weight</Link></p>
            )}
            <div style={{ marginTop: 28 }}>
              <h3 className="card-section-title">BMI</h3>
              {!settings?.height_cm ? (
                <p className="empty-state" style={{ margin: 0 }}>Set your <Link to="/settings">height in Settings</Link> to see BMI.</p>
              ) : currentBmi == null ? (
                <p className="empty-state" style={{ margin: 0 }}>No weight logged. <Link to={`/day/${date}`}>Log weight</Link> to see BMI.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <BMIGauge bmi={currentBmi} size={220} />
                  </div>
                  <p className="card-section-title" style={{ marginTop: 12, marginBottom: 0, textAlign: 'center', fontSize: '0.75rem' }}>
                    Underweight &lt;18.5 · <span style={{ color: 'var(--fiber)' }}>Normal 18.5–25</span> · Overweight 25–30 · Obese 30+
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {(todayWorkout.length > 0 || date === todayStr()) && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h2>Workout for today</h2>
              <Link to="/exercises" className="btn btn-secondary btn-sm">Plan exercises</Link>
            </div>
            {todayWorkout.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {todayWorkout.map((w) => (
                  <li
                    key={w.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.9375rem',
                    }}
                  >
                    <span>
                      <strong>{w.exercise_name}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 8, textTransform: 'capitalize' }}>{w.category}</span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{w.reps} reps</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No workout scheduled. <Link to="/exercises">Plan your exercises</Link> and drag today into the calendar.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
