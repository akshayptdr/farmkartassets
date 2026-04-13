import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Management', 'Admin', 'Other'];

const empty = { employee_id: '', name: '', email: '', department: 'IT', designation: '', phone: '' };

export default function EmployeeForm({ employee, onSuccess, onCancel }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        employee_id: employee.employee_id || '',
        name: employee.name || '',
        email: employee.email || '',
        department: employee.department || 'IT',
        designation: employee.designation || '',
        phone: employee.phone || ''
      });
    } else {
      setForm(empty);
    }
  }, [employee]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (employee?.id) {
        await api.put(`/employees/${employee.id}`, form);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', form);
        toast.success('Employee created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Employee ID *</label>
          <input className="input" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
            placeholder="EMP001" required disabled={!!employee?.id} />
        </div>
        <div>
          <label className="label">Full Name *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rahul Sharma" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@company.com" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
        </div>
        <div>
          <label className="label">Department *</label>
          <select className="input" value={form.department} onChange={e => set('department', e.target.value)} required>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Designation</label>
          <input className="input" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Software Engineer" />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : employee?.id ? 'Update Employee' : 'Create Employee'}
        </button>
      </div>
    </form>
  );
}
