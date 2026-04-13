import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

const ASSET_TYPES = ['laptop', 'desktop', 'cpu', 'keyboard', 'mouse', 'printer', 'mobile', 'cctv', 'router', 'sim', 'other'];
const CONDITIONS  = ['new', 'good', 'fair', 'damaged'];
const STATUSES    = ['available', 'assigned', 'under_repair', 'retired'];

const empty = {
  asset_id: '', asset_type: 'laptop', brand: '', model: '',
  serial_number: '', purchase_date: '', purchase_price: '',
  warranty_expiry: '', condition: 'good', status: 'available',
  location: '', notes: ''
};

export default function AssetForm({ asset, onSuccess, onCancel }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (asset) {
      setForm({
        asset_id: asset.asset_id || '',
        asset_type: asset.asset_type || 'laptop',
        brand: asset.brand || '',
        model: asset.model || '',
        serial_number: asset.serial_number || '',
        purchase_date: asset.purchase_date || '',
        purchase_price: asset.purchase_price || '',
        warranty_expiry: asset.warranty_expiry || '',
        condition: asset.condition || 'good',
        status: asset.status || 'available',
        location: asset.location || '',
        notes: asset.notes || ''
      });
    } else {
      setForm(empty);
    }
  }, [asset]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (asset?.id) {
        await api.put(`/assets/${asset.id}`, form);
        toast.success('Asset updated successfully');
      } else {
        await api.post('/assets', form);
        toast.success('Asset created successfully');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Asset ID *</label>
          <input className="input" value={form.asset_id} onChange={e => set('asset_id', e.target.value)}
            placeholder="AST-L001" required disabled={!!asset?.id} />
        </div>
        <div>
          <label className="label">Asset Type *</label>
          <select className="input" value={form.asset_type} onChange={e => set('asset_type', e.target.value)} required>
            {ASSET_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Brand *</label>
          <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Dell, HP, Lenovo..." required />
        </div>
        <div>
          <label className="label">Model *</label>
          <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Latitude 5520" required />
        </div>
        <div>
          <label className="label">Serial Number</label>
          <input className="input" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="SN12345" />
        </div>
        <div>
          <label className="label">Purchase Date</label>
          <input className="input" type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
        </div>
        <div>
          <label className="label">Purchase Price (₹)</label>
          <input className="input" type="number" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} placeholder="85000" min="0" />
        </div>
        <div>
          <label className="label">Warranty Expiry</label>
          <input className="input" type="date" value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} />
        </div>
        <div>
          <label className="label">Condition</label>
          <select className="input" value={form.condition} onChange={e => set('condition', e.target.value)}>
            {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Location</label>
          <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="IT Dept, Store Room..." />
        </div>
        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional information..." />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : asset?.id ? 'Update Asset' : 'Create Asset'}
        </button>
      </div>
    </form>
  );
}
