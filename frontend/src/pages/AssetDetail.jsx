import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Upload, X, QrCode, Download, Package, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import Modal from '../components/Modal';
import AssetForm from '../components/AssetForm';
import AssignmentForm from '../components/AssignmentForm';
import { StatusBadge, ConditionBadge, AssetTypeIcon } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-xs">{value || '—'}</span>
    </div>
  );
}

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [qrCode, setQrCode] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get(`/assets/${id}`);
      setAsset(data.data);
    } catch { toast.error('Failed to load asset'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Delete asset ${asset.asset_id}?`)) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Asset deleted');
      navigate('/assets');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('file_type', uploadType);
    setUploading(true);
    try {
      await api.post(`/assets/${id}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return;
    try {
      await api.delete(`/assets/${id}/files/${fileId}`);
      toast.success('File deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const loadQr = async () => {
    try {
      const { data } = await api.get(`/assets/${id}/qrcode`);
      setQrCode(data.qrcode);
      setModal('qr');
    } catch { toast.error('QR generation failed'); }
  };

  const ACTION_ICONS = {
    created: '✅', assigned: '👤', returned: '↩️', repaired: '🔧',
    updated: '✏️', image_added: '📎', image_removed: '🗑️',
    condition_changed: '⚡', retired: '🔴', transferred: '➡️'
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!asset) return <div className="text-center py-16 text-gray-400">Asset not found</div>;

  const photos = asset.files?.filter(f => f.file_type === 'photo') || [];
  const bills = asset.files?.filter(f => f.file_type === 'bill') || [];
  const docs = asset.files?.filter(f => f.file_type === 'document') || [];

  return (
    <div className="space-y-5 fade-in max-w-5xl">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary btn-sm"><ArrowLeft size={14} /> Back</button>
          <div>
            <div className="flex items-center gap-2">
              <AssetTypeIcon type={asset.asset_type} />
              <h1 className="text-xl font-bold text-gray-900">{asset.asset_id}</h1>
              <StatusBadge status={asset.status} />
            </div>
            <p className="text-sm text-gray-500">{asset.brand} {asset.model}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={loadQr} className="btn-secondary btn-sm"><QrCode size={14} /> QR Code</button>
            <button onClick={() => setModal('edit')} className="btn-secondary btn-sm"><Edit size={14} /> Edit</button>
            {asset.status === 'available' && (
              <button onClick={() => setModal('assign')} className="btn-primary btn-sm">Assign</button>
            )}
            <button onClick={handleDelete} className="btn-danger btn-sm"><Trash2 size={14} /></button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package size={16} /> Asset Details</h3>
            <InfoRow label="Asset ID" value={asset.asset_id} />
            <InfoRow label="Type" value={asset.asset_type ? asset.asset_type.charAt(0).toUpperCase() + asset.asset_type.slice(1) : null} />
            <InfoRow label="Brand" value={asset.brand} />
            <InfoRow label="Model" value={asset.model} />
            <InfoRow label="Serial Number" value={asset.serial_number} />
            <InfoRow label="Condition" value={<ConditionBadge condition={asset.condition} />} />
            <InfoRow label="Status" value={<StatusBadge status={asset.status} />} />
            <InfoRow label="Location" value={asset.location} />
            <InfoRow label="Purchase Date" value={asset.purchase_date} />
            <InfoRow label="Purchase Price" value={asset.purchase_price ? `₹${Number(asset.purchase_price).toLocaleString('en-IN')}` : null} />
            <InfoRow label="Warranty Expiry" value={asset.warranty_expiry} />
            {asset.notes && <InfoRow label="Notes" value={asset.notes} />}
          </div>

          {/* Current Assignment */}
          {asset.assigned_to_name && (
            <div className="card p-5 border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-blue-900 mb-3">Currently Assigned To</h3>
              <InfoRow label="Employee" value={`${asset.assigned_to_name} (${asset.assigned_to_emp_id})`} />
              <InfoRow label="Department" value={asset.assigned_to_dept} />
              <InfoRow label="Assigned Date" value={asset.assigned_date} />
              <InfoRow label="Expected Return" value={asset.expected_return_date} />
            </div>
          )}

          {/* Files */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Files & Documents</h3>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <select className="input w-auto text-xs" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                    <option value="photo">Photo</option>
                    <option value="bill">Bill/Invoice</option>
                    <option value="document">Document</option>
                  </select>
                  <label className="btn-secondary btn-sm cursor-pointer">
                    <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading}
                      accept={uploadType === 'photo' ? 'image/*' : 'image/*,.pdf,.doc,.docx'} />
                  </label>
                </div>
              )}
            </div>

            {[{ label: 'Photos', files: photos }, { label: 'Bills/Invoices', files: bills }, { label: 'Documents', files: docs }]
              .filter(g => g.files.length > 0)
              .map(group => (
                <div key={group.label} className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{group.label}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {group.files.map(f => (
                      <div key={f.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        {f.mime_type?.startsWith('image') ? (
                          <img src={`${import.meta.env.VITE_API_URL || ''}/${f.file_path}`} alt={f.original_name}
                            className="w-full h-20 object-cover" />
                        ) : (
                          <div className="h-20 flex flex-col items-center justify-center gap-1">
                            <span className="text-2xl">📄</span>
                            <span className="text-xs text-gray-500 truncate px-1 w-full text-center">{f.original_name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a href={`${import.meta.env.VITE_API_URL || ''}/${f.file_path}`} target="_blank" className="p-1 bg-white rounded text-blue-600 hover:text-blue-800">
                            <Download size={12} />
                          </a>
                          {isAdmin && (
                            <button onClick={() => handleDeleteFile(f.id)} className="p-1 bg-white rounded text-red-500">
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
            {asset.files?.length === 0 && <p className="text-sm text-gray-400">No files uploaded</p>}
          </div>
        </div>

        {/* History */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock size={16} /> History</h3>
          <div className="space-y-3">
            {asset.history?.map((h, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-base flex-shrink-0">{ACTION_ICONS[h.action] || '•'}</span>
                <div className="min-w-0">
                  <p className="text-gray-700">{h.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {h.performed_by_name} · {new Date(h.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {!asset.history?.length && <p className="text-sm text-gray-400">No history yet</p>}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Asset" size="lg">
        <AssetForm asset={asset} onSuccess={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />
      </Modal>

      {/* Assign Modal */}
      <Modal open={modal === 'assign'} onClose={() => setModal(null)} title="Assign Asset">
        <AssignmentForm preAssetId={asset.id} onSuccess={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />
      </Modal>

      {/* QR Modal */}
      <Modal open={modal === 'qr'} onClose={() => setModal(null)} title="Asset QR Code" size="sm">
        {qrCode && (
          <div className="flex flex-col items-center gap-4">
            <img src={qrCode} alt="QR" className="w-56 h-56 border border-gray-200 rounded-xl" />
            <div className="text-center">
              <p className="font-bold text-lg">{asset.asset_id}</p>
              <p className="text-sm text-gray-500">{asset.brand} {asset.model}</p>
            </div>
            <a href={qrCode} download={`qr_${asset.asset_id}.png`} className="btn-primary btn-sm">
              <Download size={14} /> Download
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
