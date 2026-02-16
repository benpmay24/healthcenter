import { useState } from 'react';
import { api } from '../api';
import { useModal } from '../context/ModalContext';

export default function WeightForm({ date, initialWeight, onSave }) {
  const { showAlert, showConfirm } = useModal();
  const [weight, setWeight] = useState(initialWeight?.weight_lbs?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (Number.isNaN(w) || w <= 0) return;
    setSaving(true);
    try {
      await api.setWeight(date, w);
      onSave();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!initialWeight) return;
    const ok = await showConfirm('Remove weight for this day?', { title: 'Remove weight', confirmLabel: 'Remove', cancelLabel: 'Cancel', danger: true });
    if (!ok) return;
    setSaving(true);
    try {
      await api.deleteWeight(date);
      setWeight('');
      onSave();
    } catch (err) {
      showAlert(err.message, { variant: 'error', title: 'Error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Weight</h2>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ marginBottom: 0, width: 140 }}>
          <label htmlFor="weight-lbs">Weight (lbs)</label>
          <input
            id="weight-lbs"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 160"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? 'Saving…' : initialWeight ? 'Update' : 'Save'}
        </button>
        {initialWeight && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={remove} disabled={saving}>
            Remove
          </button>
        )}
      </form>
    </div>
  );
}
