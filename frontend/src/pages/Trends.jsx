import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

import { Link } from 'react-router-dom';
import { api } from '../api';

const BMI_ZONES = [
  { y1: 10, y2: 18.5, fill: 'rgba(148, 163, 184, 0.25)' },
  { y1: 18.5, y2: 25, fill: 'rgba(34, 197, 94, 0.2)' },
  { y1: 25, y2: 30, fill: 'rgba(249, 115, 22, 0.2)' },
  { y1: 30, y2: 45, fill: 'rgba(239, 68, 68, 0.2)' },
];

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export default function Trends() {
  const [range, setRange] = useState(getDefaultRange());
  const [weightData, setWeightData] = useState([]);
  const [macrosData, setMacrosData] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [wRes, mRes, settingsRes] = await Promise.all([
          api.getWeightTrend(range.from, range.to),
          api.getMacrosTrend(range.from, range.to),
          api.getSettings(),
        ]);
        if (!cancelled) {
          setWeightData(wRes.data || []);
          setMacrosData(mRes.byDate || []);
          setSettings(settingsRes);
        }
      } catch (e) {
        if (!cancelled) {
          setWeightData([]);
          setMacrosData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range.from, range.to]);

  const heightM = settings?.height_cm != null ? Number(settings.height_cm) / 100 : null;
  const bmiData = useMemo(() => {
    if (!heightM || heightM <= 0) return [];
    return (weightData || []).map((d) => {
      const weightKg = d.weight_kg != null ? d.weight_kg : d.weight_lbs / 2.20462262185;
      return {
        ...d,
        bmi: Math.round((weightKg / (heightM * heightM)) * 10) / 10,
      };
    });
  }, [weightData, heightM]);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <h1>Trends</h1>
          <p>Weight and nutrition over time</p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ marginBottom: 0, width: 160 }}>
            <label htmlFor="trend-from">From</label>
            <input
              id="trend-from"
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0, width: 160 }}>
            <label htmlFor="trend-to">To</label>
            <input
              id="trend-to"
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 80 }}>
          <p className="empty-state">Loading…</p>
        </div>
      ) : (
        <div className="grid grid--2" style={{ marginTop: 8 }}>
          <div className="card">
            <div className="card-header">
              <h2>Weight (lbs)</h2>
            </div>
            {weightData.length === 0 ? (
              <p className="empty-state">No weight data in this range. Log weight on the Daily log page.</p>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      formatter={(value) => [`${value} lbs`, 'Weight']}
                    />
                    <Line type="monotone" dataKey="weight_lbs" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} name="Weight" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2>BMI over time</h2>
            </div>
            {!settings?.height_cm ? (
              <p className="empty-state">Set your height in <Link to="/settings">Settings</Link> to see BMI.</p>
            ) : bmiData.length === 0 ? (
              <p className="empty-state">No weight data in this range. Log weight to see BMI.</p>
            ) : (
              <>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bmiData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      {BMI_ZONES.map((z, i) => (
                        <ReferenceArea key={i} y1={z.y1} y2={z.y2} fill={z.fill} fillOpacity={1} />
                      ))}
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis domain={[15, 40]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                        labelStyle={{ color: 'var(--text-muted)' }}
                        formatter={(value) => [`${value}`, 'BMI']}
                        labelFormatter={(d) => d && new Date(d).toLocaleDateString()}
                      />
                      <Line type="monotone" dataKey="bmi" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} name="BMI" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="chart-caption">
                  Underweight &lt;18.5 · <span style={{ color: 'var(--fiber)' }}>Normal 18.5–25</span> · Overweight 25–30 · Obese 30+
                </p>
              </>
            )}
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2>Calories per day</h2>
            </div>
            {macrosData.length === 0 ? (
              <p className="empty-state">No nutrition data in this range.</p>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={macrosData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      formatter={(value) => [Math.round(value), 'Calories']}
                    />
                    {settings?.goal_calories != null && (
                      <ReferenceLine
                        y={settings.goal_calories}
                        stroke="var(--calories)"
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                        label={{ value: 'Goal', position: 'right', fill: 'var(--text-muted)', fontSize: 10 }}
                      />
                    )}
                    <Area type="monotone" dataKey="calories" stroke="var(--calories)" fill="var(--calories)" fillOpacity={0.2} strokeWidth={2} name="Calories" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2>Macros per day (g)</h2>
            </div>
            {macrosData.length === 0 ? (
              <p className="empty-state">No nutrition data in this range.</p>
            ) : (
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macrosData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                    />
                    {settings?.goal_protein != null && (
                      <ReferenceLine
                        y={settings.goal_protein}
                        stroke="var(--protein)"
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                        label={{ value: 'Protein goal', position: 'right', fill: 'var(--text-muted)', fontSize: 10 }}
                      />
                    )}
                    {settings?.goal_carbs != null && (
                      <ReferenceLine
                        y={settings.goal_carbs}
                        stroke="var(--carbs)"
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                        label={{ value: 'Carbs goal', position: 'right', fill: 'var(--text-muted)', fontSize: 10 }}
                      />
                    )}
                    {settings?.goal_fat != null && (
                      <ReferenceLine
                        y={settings.goal_fat}
                        stroke="var(--fat)"
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                        label={{ value: 'Fat goal', position: 'right', fill: 'var(--text-muted)', fontSize: 10 }}
                      />
                    )}
                    <Legend />
                    <Line type="monotone" dataKey="protein" stroke="var(--protein)" strokeWidth={2} dot={false} name="Protein" />
                    <Line type="monotone" dataKey="carbs" stroke="var(--carbs)" strokeWidth={2} dot={false} name="Carbs" />
                    <Line type="monotone" dataKey="fat" stroke="var(--fat)" strokeWidth={2} dot={false} name="Fat" />
                    <Line type="monotone" dataKey="fiber" stroke="var(--fiber)" strokeWidth={2} dot={false} name="Fiber" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
