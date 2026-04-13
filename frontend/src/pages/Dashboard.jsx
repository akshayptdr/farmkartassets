import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle, Clock, AlertTriangle, Users, Wrench, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../api';
import { StatusBadge, AssetTypeIcon } from '../components/StatusBadge';

function StatCard({ title, value, icon: Icon, color, sub, to }) {
  const content = (
    <div className={`card p-5 hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100')}`}>
          <Icon size={22} className={color} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/stats').then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const { overview, byType, byDepartment, recentActivity, purchaseValue } = stats || {};

  const formatCurrency = (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0';

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Asset management overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assets" value={overview?.totalAssets} icon={Package} color="text-blue-600" to="/assets" />
        <StatCard title="Available" value={overview?.available} icon={CheckCircle} color="text-green-600" to="/assets?status=available" />
        <StatCard title="Assigned" value={overview?.assignedAssets} icon={Users} color="text-indigo-600" to="/assets?status=assigned" />
        <StatCard title="Under Repair" value={overview?.underRepair} icon={Wrench} color="text-yellow-600" to="/assets?status=under_repair" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overdue Returns" value={overview?.overdueCount} icon={AlertTriangle}
          color={overview?.overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}
          sub={overview?.overdueCount > 0 ? 'Action required' : 'All on time'}
          to="/assignments?overdue=true"
        />
        <StatCard title="Total Employees" value={overview?.totalEmployees} icon={Users} color="text-purple-600" to="/employees" />
        <StatCard title="Retired Assets" value={overview?.retired} icon={Package} color="text-gray-500" />
        <StatCard title="Total Asset Value" value={formatCurrency(purchaseValue)} icon={TrendingUp} color="text-teal-600" />
      </div>

      {/* Overdue alert */}
      {overview?.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-red-800">{overview.overdueCount} overdue return{overview.overdueCount > 1 ? 's' : ''}</p>
              <p className="text-sm text-red-600">Some assets are past their expected return date</p>
            </div>
          </div>
          <Link to="/assignments?overdue=true" className="btn-danger btn-sm flex-shrink-0">
            View Overdue <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets by type */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Assets by Type</h3>
          <div className="space-y-3">
            {byType?.map(t => (
              <div key={t.asset_type} className="flex items-center gap-3">
                <AssetTypeIcon type={t.asset_type} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium capitalize">{t.asset_type}</span>
                    <span className="text-gray-500">{t.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(t.count / (overview?.totalAssets || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By department */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Assigned by Department</h3>
          {byDepartment?.length ? (
            <div className="space-y-3">
              {byDepartment.map(d => (
                <div key={d.department} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{d.department}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(d.assigned_assets / (overview?.assignedAssets || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-6 text-right">{d.assigned_assets}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No data available</p>}
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <Link to="/history" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentActivity?.map((a, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                <div className="min-w-0">
                  <p className="text-gray-700 truncate">
                    <span className="font-medium">{a.asset_code}</span> — {a.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {a.performed_by_name} · {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
            {!recentActivity?.length && <p className="text-sm text-gray-400">No recent activity</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
