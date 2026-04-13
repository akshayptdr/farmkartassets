import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, RotateCcw, AlertTriangle, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import Modal from '../components/Modal';
import AssignmentForm from '../components/AssignmentForm';
import ReturnForm from '../components/ReturnForm';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function Assignments() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [assignments, setAssignments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'active',
    overdue: searchParams.get('overdue') === 'true'
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filters.status) params.set('status', filters.status);
      if (filters.overdue) params.set('overdue', 'true');
      const { data } = await api.get(`/assignments?${params}`);
      let results = data.data;
      if (search) {
        const s = search.toLowerCase();
        results = results.filter(a =>
          a.asset_code?.toLowerCase().includes(s) ||
          a.employee_name?.toLowerCase().includes(s) ||
          a.employee_code?.toLowerCase().includes(s) ||
          a.department?.toLowerCase().includes(s)
        );
      }
      setAssignments(results);
      setTotal(data.total);
    } catch { toast.error('Failed to load assignments'); }
    finally { setLoading(false); }
  }, [page, filters, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment record?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const isOverdue = (a) => a.status === 'active' && a.expected_return_date && new Date(a.expected_return_date) < new Date();

  return (
    <div className="space-y-5 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500">{total} records</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/reports/export/assignments/csv" className="btn-secondary btn-sm" target="_blank">
            <Download size={14} /> Export CSV
          </a>
          {isAdmin && (
            <button className="btn-primary" onClick={() => setModal('assign')}>
              <Plus size={16} /> New Assignment
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by asset, employee, department..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="input w-auto text-sm" value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value, overdue: false }))}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
          </select>
          <button
            onClick={() => setFilters(f => ({ ...f, overdue: !f.overdue, status: f.overdue ? 'active' : '' }))}
            className={`btn-sm flex items-center gap-1.5 ${filters.overdue ? 'btn-danger' : 'btn-secondary'}`}
          >
            <AlertTriangle size={13} /> Overdue
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Asset</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Expected Return</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                {isAdmin && <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : assignments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No assignments found</td></tr>
              ) : assignments.map(a => (
                <tr key={a.id} className={`table-row ${isOverdue(a) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <Link to={`/assets/${a.asset_id}`} className="font-medium text-blue-600 hover:underline">
                      {a.asset_code}
                    </Link>
                    <div className="text-xs text-gray-500">{a.brand} {a.model}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{a.employee_name}</div>
                    <div className="text-xs text-gray-500">{a.employee_code}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.department}</td>
                  <td className="px-4 py-3 text-gray-600">{a.assigned_date}</td>
                  <td className="px-4 py-3">
                    {a.expected_return_date ? (
                      <span className={isOverdue(a) ? 'text-red-600 font-medium flex items-center gap-1' : 'text-gray-600'}>
                        {isOverdue(a) && <AlertTriangle size={12} />}
                        {a.expected_return_date}
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                    {a.actual_return_date && <div className="text-xs text-gray-400 mt-0.5">Returned: {a.actual_return_date}</div>}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === 'active' && (
                          <button onClick={() => { setSelected(a); setModal('return'); }}
                            className="btn-secondary btn-sm">
                            <RotateCcw size={13} /> Return
                          </button>
                        )}
                        {a.status === 'returned' && (
                          <button onClick={() => handleDelete(a.id)}
                            className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {Math.ceil(total / LIMIT) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)} className="btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal === 'assign'} onClose={() => setModal(null)} title="New Assignment">
        <AssignmentForm onSuccess={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'return'} onClose={() => setModal(null)} title="Return Asset">
        <ReturnForm assignment={selected} onSuccess={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />
      </Modal>
    </div>
  );
}
