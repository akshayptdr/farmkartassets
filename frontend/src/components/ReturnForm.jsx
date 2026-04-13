import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

const CONDITIONS = ['good', 'fair', 'damaged'];

export default function ReturnForm({ assignment, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    actual_return_date: new Date().toISOString().split('T')[0],
    return_condition: 'good',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/assignments/${assignment.id}/return`, form);
      toast.success('Asset returned successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p><span className="font-medium">Asset:</span> {assignment.asset_code} — {assignment.brand} {assignment.model}</p>
        <p><span className="font-medium">Employee:</span> {assignment.employee_name} ({assignment.employee_code})</p>
        <p><span className="font-medium">Assigned:</span> {assignment.assigned_date}</p>
        {assignment.expected_return_date && (
          <p><span className="font-medium">Expected Return:</span> {assignment.expected_return_date}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Return Date *</label>
          <input className="input" type="date" value={form.actual_return_date}
            onChange={e => setForm(f => ({ ...f, actual_return_date: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Return Condition *</label>
          <select className="input" value={form.return_condition}
            onChange={e => setForm(f => ({ ...f, return_condition: e.target.value }))}>
            {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {form.return_condition === 'damaged' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          Asset will be moved to "Under Repair" status after return.
        </div>
      )}

      <div>
        <label className="label">Return Notes</label>
        <textarea className="input" rows={2} value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Any damage, missing parts, observations..." />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-success" disabled={saving}>
          {saving ? 'Processing...' : 'Confirm Return'}
        </button>
      </div>
    </form>
  );
}
