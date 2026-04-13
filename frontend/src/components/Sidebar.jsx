import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ClipboardList,
  History, BarChart2, LogOut, X, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { to: '/assets',      label: 'Assets',       icon: Package },
  { to: '/assignments', label: 'Assignments',  icon: ClipboardList },
  { to: '/employees',   label: 'Employees',    icon: Users },
  { to: '/history',     label: 'History',      icon: History },
  { to: '/reports',     label: 'Reports',      icon: BarChart2 },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white leading-none">AssetTrack</div>
            <div className="text-xs text-gray-400 mt-0.5">Asset Management</div>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 hover:text-gray-300">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-700 p-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.username}</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}
