import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Package, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import Modal from '../components/Modal';
import EmployeeForm from '../components/EmployeeForm';
import { useAuth } from '../context/AuthContext';

export default function Employees() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch all (active + inactive) so we know the inactive count
      const params = new URLSearchParams({ limit: 200, show_inactive: 'true' });
      if (search) params.set('search', search);
      if (dept) params.set('department', dept);
      const [empRes, deptRes] = await Promise.all([
        api.get(`/employees?${params}`),
        api.get('/employees/departments')
      ]);
      setEmployees(empRes.data.data);
      setTotal(empRes.data.total);
      setDepartments(deptRes.data.data);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  }, [search, dept]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async (emp) => {
    if (!confirm(`Deactivate ${emp.name}? They won't appear in assignment lists.`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      toast.success('Employee deactivated');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReactivate = async (emp) => {
    try {
      await api.put(`/employees/${emp.id}`, { is_active: 1 });
      toast.success(`${emp.name} reactivated`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const activeCount  = employees.filter(e => e.is_active).length;
  const inactiveCount = employees.filter(e => !e.is_active).length;
  const visible = showInactive ? employees : employees.filter(e => e.is_active);

  return (
    <div className="space-y-5 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500">
            {activeCount} active
            {inactiveCount > 0 && <span className="text-gray-400"> · {inactiveCount} inactive</span>}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setSelected(null); setModal(true); }}>
            <Plus size={16} /> Add Employee
          </button>
        )}
      </div>

      <div className="card p-4 flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, ID, email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm" value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {isAdmin && inactiveCount > 0 && (
          <button
            onClick={() => setShowInactive(v => !v)}
            className={`btn-sm flex items-center gap-1.5 ${showInactive ? 'btn-primary' : 'btn-secondary'}`}
          >
            <UserX size={13} />
            {showInactive ? 'Hide Inactive' : `Show Inactive (${inactiveCount})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-400">No employees found</div>
        ) : visible.map(emp => (
          <div key={emp.id} className={`card p-4 hover:shadow-md transition-shadow ${!emp.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                  ${emp.is_active ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-400'}`}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                    {emp.name}
                    {!emp.is_active && <span className="badge bg-gray-100 text-gray-500 text-xs">Inactive</span>}
                  </div>
                  <div className="text-xs text-gray-500">{emp.employee_id}</div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1 flex-shrink-0">
                  {emp.is_active ? (
                    <>
                      <button onClick={() => { setSelected(emp); setModal(true); }}
                        className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeactivate(emp)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Deactivate">
                        <UserX size={14} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleReactivate(emp)}
                      className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg" title="Reactivate">
                      <UserCheck size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-4 text-center">🏢</span>
                <span>{emp.department}</span>
              </div>
              {emp.designation && (
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="w-4 text-center">💼</span>
                  <span className="truncate">{emp.designation}</span>
                </div>
              )}
              {emp.email && (
                <div className="flex items-center gap-2 text-gray-500 min-w-0">
                  <span className="w-4 text-center flex-shrink-0">✉️</span>
                  <span className="truncate text-xs">{emp.email}</span>
                </div>
              )}
              {emp.phone && (
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="w-4 text-center">📞</span>
                  <span>{emp.phone}</span>
                </div>
              )}
            </div>

            {emp.active_assignments > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-sm text-blue-600">
                <Package size={13} />
                <span>{emp.active_assignments} asset{emp.active_assignments > 1 ? 's' : ''} assigned</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={selected ? 'Edit Employee' : 'Add Employee'}>
        <EmployeeForm employee={selected} onSuccess={() => { setModal(false); load(); }} onCancel={() => setModal(false)} />
      </Modal>
    </div>
  );
}
