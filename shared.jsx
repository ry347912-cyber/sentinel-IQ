import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Protected Route ──────────────────────────────────────────────────────
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-cyan-400 text-sm font-mono">VERIFYING IDENTITY...</span>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Status Badge ─────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    SUCCESS: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    FAILURE: 'bg-red-500/20 text-red-400 border-red-500/30',
    WARNING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    CRITICAL: 'bg-red-600/30 text-red-300 border-red-600/40 animate-pulse',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${map[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
};

// ─── Trust Score Ring ─────────────────────────────────────────────────────
export const TrustScore = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 20, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex items-center gap-2">
      <svg width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r={r} fill="none" stroke="#1f2937" strokeWidth="4" />
        <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 25 25)" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        <text x="25" y="29" textAnchor="middle" fontSize="11" fill={color} fontWeight="bold" fontFamily="monospace">
          {score}
        </text>
      </svg>
      <div>
        <p className="text-xs text-gray-500 font-mono">TRUST</p>
        <p className="text-xs font-bold" style={{ color }}>
          {score >= 80 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW'}
        </p>
      </div>
    </div>
  );
};

// ─── Loading Spinner ──────────────────────────────────────────────────────
export const Spinner = ({ size = 'sm' }) => (
  <div className={`border-2 border-cyan-500 border-t-transparent rounded-full animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'}`} />
);
