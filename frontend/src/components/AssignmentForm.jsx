import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

export default function AssignmentForm({ preAssetId, onSuccess, onCancel }) {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    asset_id: preAssetId || '',
    employee_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/assets?status=available&limit=200'),
      api.get('/employees?limit=200')
    ]).then(([a, e]) => {
      setAssets(a.data.data);
      setEmployees(e.data.data);
    }).catch(() => toast.error('Failed to load data'));
  }, []);

  useEffect(() => {
    if (preAssetId) setForm(f => ({ ...f, asset_id: preAssetId }));
  }, [preAssetId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_id || !form.employee_id) {
      return toast.error('Please select both asset and employee');
    }
    setSaving(true);
    try {
      await api.post('/assignments', form);
      toast.success('Asset assigned successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Asset *</label>
        <select className="input" value={form.asset_id} onChange={e => set('asset_id', e.target.value)} required disabled={!!preAssetId}>
          <option value="">— Select Asset —</option>
          {assets.map(a => (
            <option key={a.id} value={a.id}>
              {a.asset_id} — {a.asset_type.charAt(0).toUpperCase() + a.asset_type.slice(1)} | {a.brand} {a.model}
            </option>
          ))}
        </select>
        {assets.length === 0 && <p className="text-xs text-yellow-600 mt-1">No available assets found</p>}
      </div>

      <div>
        <label className="label">Assign To (Employee) *</label>
        <select className="input" value={form.employee_id} onChange={e => set('employee_id', e.target.value)} required>
          <option value="">— Select Employee —</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.employee_id} — {e.name} ({e.department})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Assigned Date *</label>
          <input className="input" type="date" value={form.assigned_date} onChange={e => set('assigned_date', e.target.value)} required />
        </div>
        <div>
          <label className="label">Expected Return Date</label>
          <input className="input" type="date" value={form.expected_return_date} onChange={e => set('expected_return_date', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Reason for assignment, accessories included..." />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Assigning...' : 'Assign Asset'}
        </button>
      </div>
    </form>
  );
}
