import React, { useState, useEffect } from 'react';
import { Download, BarChart2, TrendingUp, Package, Users } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';
import { AssetTypeIcon } from '../components/StatusBadge';

const TYPES = ['laptop','desktop','cpu','keyboard','mouse','printer','mobile','cctv','router','sim','other'];
const STATUSES = ['available','assigned','under_repair','retired'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportFilter, setExportFilter] = useState({ type: '', status: '' });

  useEffect(() => {
    api.get('/reports/stats').then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  const buildExportUrl = (base) => {
    const params = new URLSearchParams();
    if (exportFilter.type) params.set('type', exportFilter.type);
    if (exportFilter.status) params.set('status', exportFilter.status);
    return `${base}?${params}`;
  };

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const { overview, byType, byDepartment, purchaseValue } = stats || {};

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Asset insights and export tools</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: overview?.totalAssets, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Value', value: formatCurrency(purchaseValue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Assigned', value: `${overview?.assignedAssets} / ${overview?.totalAssets}`, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Overdue Returns', value: overview?.overdueCount, icon: BarChart2, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className={`${bg} p-3 rounded-xl`}><Icon size={20} className={color} /></div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset breakdown by type */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Asset Breakdown by Type</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                <th className="text-right py-2 text-gray-500 font-medium">Assigned</th>
                <th className="text-right py-2 text-gray-500 font-medium">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {byType?.map(t => (
                <tr key={t.asset_type}>
                  <td className="py-2.5 flex items-center gap-2">
                    <AssetTypeIcon type={t.asset_type} />
                    <span className="capitalize">{t.asset_type}</span>
                  </td>
                  <td className="py-2.5 text-right font-medium">{t.count}</td>
                  <td className="py-2.5 text-right text-blue-600">{t.assigned}</td>
                  <td className="py-2.5 text-right text-green-600">{t.available}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-semibold">
                <td className="pt-2">Total</td>
                <td className="pt-2 text-right">{overview?.totalAssets}</td>
                <td className="pt-2 text-right text-blue-600">{overview?.assignedAssets}</td>
                <td className="pt-2 text-right text-green-600">{overview?.available}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Department distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Assets by Department</h3>
          {byDepartment?.length ? (
            <div className="space-y-3">
              {byDepartment.map(d => {
                const pct = Math.round((d.assigned_assets / (overview?.assignedAssets || 1)) * 100);
                return (
                  <div key={d.department}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{d.department}</span>
                      <span className="font-medium">{d.assigned_assets} assets</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-gray-400">No department data</p>}
        </div>
      </div>

      {/* Export section */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download size={18} /> Export Data
        </h3>
        <div className="flex flex-wrap gap-3 items-end mb-5">
          <div>
            <label className="label">Filter by Type</label>
            <select className="input w-auto text-sm" value={exportFilter.type}
              onChange={e => setExportFilter(f => ({ ...f, type: e.target.value }))}>
              <option value="">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Filter by Status</label>
            <select className="input w-auto text-sm" value={exportFilter.status}
              onChange={e => setExportFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg"><Package size={18} className="text-green-600" /></div>
              <div>
                <p className="font-semibold text-gray-800">Assets Report</p>
                <p className="text-xs text-gray-500">Full inventory with assignment details</p>
              </div>
            </div>
            <a href={buildExportUrl('/api/reports/export/csv')} target="_blank"
              className="btn-success btn-sm w-full justify-center mt-2">
              <Download size={14} /> Download Assets CSV
            </a>
          </div>

          <div className="p-4 border border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Users size={18} className="text-blue-600" /></div>
              <div>
                <p className="font-semibold text-gray-800">Assignments Report</p>
                <p className="text-xs text-gray-500">All assignment history with return status</p>
              </div>
            </div>
            <a href="/api/reports/export/assignments/csv" target="_blank"
              className="btn-primary btn-sm w-full justify-center mt-2">
              <Download size={14} /> Download Assignments CSV
            </a>
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Status Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Available', value: overview?.available, color: 'bg-green-500' },
            { label: 'Assigned', value: overview?.assignedAssets, color: 'bg-blue-500' },
            { label: 'Under Repair', value: overview?.underRepair, color: 'bg-yellow-500' },
            { label: 'Retired', value: overview?.retired, color: 'bg-gray-400' },
          ].map(({ label, value, color }) => {
            const pct = Math.round(((value || 0) / (overview?.totalAssets || 1)) * 100);
            return (
              <div key={label} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={color.replace('bg-', '').includes('green') ? '#22c55e' :
                              color.includes('blue') ? '#3b82f6' :
                              color.includes('yellow') ? '#eab308' : '#9ca3af'}
                      strokeWidth="3"
                      strokeDasharray={`${pct} ${100 - pct}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-800">{value || 0}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
