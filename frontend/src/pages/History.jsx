import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const ACTIONS = ['created','updated','assigned','returned','repaired','transferred','condition_changed','retired','image_added'];

const ACTION_CONFIG = {
  created:           { icon: '✅', color: 'bg-green-100 text-green-700' },
  assigned:          { icon: '👤', color: 'bg-blue-100 text-blue-700' },
  returned:          { icon: '↩️', color: 'bg-indigo-100 text-indigo-700' },
  repaired:          { icon: '🔧', color: 'bg-yellow-100 text-yellow-700' },
  updated:           { icon: '✏️', color: 'bg-gray-100 text-gray-700' },
  image_added:       { icon: '📎', color: 'bg-purple-100 text-purple-700' },
  image_removed:     { icon: '🗑️', color: 'bg-red-100 text-red-600' },
  condition_changed: { icon: '⚡', color: 'bg-orange-100 text-orange-700' },
  retired:           { icon: '🔴', color: 'bg-red-100 text-red-600' },
  transferred:       { icon: '➡️', color: 'bg-teal-100 text-teal-700' },
};

export default function History() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (action) params.set('action', action);
      const { data } = await api.get(`/history?${params}`);
      let results = data.data;
      if (search) {
        const s = search.toLowerCase();
        results = results.filter(h =>
          h.asset_code?.toLowerCase().includes(s) ||
          h.description?.toLowerCase().includes(s) ||
          h.performed_by_name?.toLowerCase().includes(s)
        );
      }
      setHistory(results);
      setTotal(data.total);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  }, [page, action, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset History</h1>
        <p className="text-sm text-gray-500">Complete audit trail of all asset activities</p>
      </div>

      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by asset, description, user..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm" value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {ACTIONS.map(a => (
            <option key={a} value={a}>{a.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Asset</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Performed By</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No history found</td></tr>
              ) : history.map(h => {
                const config = ACTION_CONFIG[h.action] || { icon: '•', color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={h.id} className="table-row">
                    <td className="px-4 py-3">
                      <Link to={`/assets/${h.asset_id}`} className="font-medium text-blue-600 hover:underline">
                        {h.asset_code}
                      </Link>
                      <div className="text-xs text-gray-400">{h.brand} {h.model}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${config.color} gap-1`}>
                        {config.icon} {h.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <p className="truncate">{h.description}</p>
                      {(h.old_value || h.new_value) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {h.old_value && <span className="line-through mr-1">{h.old_value}</span>}
                          {h.new_value && <span className="text-green-600">{h.new_value}</span>}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{h.performed_by_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(h.created_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
