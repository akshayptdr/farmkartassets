import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, Download, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import Modal from '../components/Modal';
import AssetForm from '../components/AssetForm';
import AssignmentForm from '../components/AssignmentForm';
import { StatusBadge, ConditionBadge, AssetTypeIcon } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const TYPES = ['laptop','desktop','cpu','keyboard','mouse','printer','mobile','cctv','router','sim','other'];
const STATUSES = ['available','assigned','under_repair','retired'];

export default function Assets() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    condition: ''
  });
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'assign'
  const [selected, setSelected] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, search });
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.condition) params.set('condition', filters.condition);
      const { data } = await api.get(`/assets?${params}`);
      setAssets(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load assets'); }
    finally { setLoading(false); }
  }, [page, search, filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (asset) => {
    if (!confirm(`Delete asset ${asset.asset_id}? This cannot be undone.`)) return;
    try {
      await api.delete(`/assets/${asset.id}`);
      toast.success('Asset deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const showQr = async (asset) => {
    try {
      const { data } = await api.get(`/assets/${asset.id}/qrcode`);
      setQrModal({ qrcode: data.qrcode, asset_id: data.asset_id, label: `${asset.brand} ${asset.model}` });
    } catch { toast.error('Failed to generate QR code'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500">{total} total assets</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/reports/export/csv" className="btn-secondary btn-sm" target="_blank">
            <Download size={14} /> Export CSV
          </a>
          {isAdmin && (
            <button className="btn-primary" onClick={() => { setSelected(null); setModal('add'); }}>
              <Plus size={16} /> Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by Asset ID, brand, model, serial..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input w-auto text-sm" value={filters.type}
            onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select className="input w-auto text-sm" value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Asset</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Serial No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Condition</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned To</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No assets found</td></tr>
              ) : assets.map(asset => (
                <tr key={asset.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AssetTypeIcon type={asset.asset_type} />
                      <div>
                        <div className="font-medium text-gray-900">{asset.asset_id}</div>
                        <div className="text-xs text-gray-500">{asset.brand} {asset.model}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{asset.asset_type}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{asset.serial_number || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={asset.status} /></td>
                  <td className="px-4 py-3"><ConditionBadge condition={asset.condition} /></td>
                  <td className="px-4 py-3">
                    {asset.assigned_to_name ? (
                      <div>
                        <div className="text-gray-800">{asset.assigned_to_name}</div>
                        <div className="text-xs text-gray-400">{asset.assigned_to_dept}</div>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/assets/${asset.id}`} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="View">
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => showQr(asset)} className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg" title="QR Code">
                        <QrCode size={15} />
                      </button>
                      {isAdmin && (
                        <>
                          {asset.status === 'available' && (
                            <button onClick={() => { setSelected(asset); setModal('assign'); }}
                              className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg" title="Assign">
                              <Plus size={15} />
                            </button>
                          )}
                          <button onClick={() => { setSelected(asset); setModal('edit'); }}
                            className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg" title="Edit">
                            <Edit size={15} />
                          </button>
                          <button onClick={() => handleDelete(asset)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal === 'add' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Edit Asset' : 'Add New Asset'}
        size="lg">
        <AssetForm asset={modal === 'edit' ? selected : null}
          onSuccess={() => { setModal(null); load(); }}
          onCancel={() => setModal(null)} />
      </Modal>

      {/* Assign Modal */}
      <Modal open={modal === 'assign'} onClose={() => setModal(null)} title="Assign Asset">
        <AssignmentForm preAssetId={selected?.id}
          onSuccess={() => { setModal(null); load(); }}
          onCancel={() => setModal(null)} />
      </Modal>

      {/* QR Modal */}
      <Modal open={!!qrModal} onClose={() => setQrModal(null)} title="Asset QR Code" size="sm">
        {qrModal && (
          <div className="flex flex-col items-center gap-4">
            <img src={qrModal.qrcode} alt="QR Code" className="w-56 h-56 border border-gray-200 rounded-xl" />
            <div className="text-center">
              <p className="font-bold text-lg">{qrModal.asset_id}</p>
              <p className="text-sm text-gray-500">{qrModal.label}</p>
            </div>
            <a href={qrModal.qrcode} download={`qr_${qrModal.asset_id}.png`} className="btn-primary btn-sm">
              <Download size={14} /> Download QR
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
