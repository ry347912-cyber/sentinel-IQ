import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, ScrollText, Monitor,
  Activity, Settings, LogOut, Menu, X, User, ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/logs',            label: 'Access Logs',     icon: ScrollText },
  { path: '/devices',         label: 'Devices',         icon: Monitor },
  { path: '/device-activity', label: 'Activity',        icon: Activity },
];
const adminItems = [
  { path: '/admin', label: 'Admin Panel', icon: Settings },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const items = [...navItems, ...(user?.role === 'admin' ? adminItems : [])];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-white font-bold text-sm tracking-wider font-mono hidden sm:block">
            ZTNA<span className="text-cyan-400">SYS</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
          {items.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
                location.pathname === path
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </Link>
          ))}
        </div>

        {/* User dropdown (desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-gray-300">{user?.username}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${user?.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {user?.role?.toUpperCase()}
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                <Link to="/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono text-gray-300 hover:bg-gray-800 transition-colors">
                  <User className="w-3.5 h-3.5" /> Profile & Settings
                </Link>
                <div className="border-t border-gray-800" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-mono text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="lg:hidden text-gray-400 hover:text-white p-1">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 flex flex-col gap-1">
          {items.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors ${
                location.pathname === path ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}>
              <Icon className="w-4 h-4" />{label}<ChevronRight className="w-3 h-3 ml-auto" />
            </Link>
          ))}
          <Link to="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <User className="w-4 h-4" /> Profile & Settings <ChevronRight className="w-3 h-3 ml-auto" />
          </Link>
          <div className="border-t border-gray-800 my-1" />
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}

      {/* Click-outside to close profile dropdown */}
      {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}
    </nav>
  );
}
