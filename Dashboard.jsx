import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Activity, Users, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, TrustScore } from '../components/shared';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const StatCard = ({ icon: Icon, label, value, sub, color = 'cyan' }) => {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {sub && <span className="text-xs font-mono text-gray-600">{sub}</span>}
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-xs font-mono text-gray-500">{label}</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ZERO TRUST DASHBOARD
            </div>
            <h1 className="text-2xl font-black text-white">
              Welcome back, <span className="text-cyan-400">{user?.username}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">All access is verified. All activity is monitored.</p>
          </div>
          <TrustScore score={user?.trustScore || 100} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 animate-pulse h-28" />
            ))}
          </div>
        ) : stats && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Activity} label="TOTAL EVENTS" value={stats.totalEvents.toLocaleString()} color="cyan" />
              <StatCard icon={CheckCircle} label="SUCCESS RATE" value={`${stats.successRate}%`} color="emerald" sub="7D AVG" />
              <StatCard icon={AlertTriangle} label="CRITICAL ALERTS" value={stats.criticalAlerts} color="red" />
              <StatCard icon={Clock} label="ACTIVE SESSIONS" value={stats.activeSessions} color="amber" />
            </div>

            {/* Activity Chart */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-mono text-gray-500 mb-0.5">ACTIVITY TIMELINE</p>
                  <h3 className="text-sm font-bold text-white">7-Day Access Events</h3>
                </div>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={stats.activityChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'monospace' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} fill="url(#cyanGrad)" name="Total" />
                  <Area type="monotone" dataKey="failures" stroke="#ef4444" strokeWidth={2} fill="url(#redGrad)" name="Failures" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Alerts */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white font-mono">RECENT SECURITY ALERTS</h3>
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              {stats.recentAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-600 font-mono text-sm">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                  No recent alerts. System nominal.
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentAlerts.map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusBadge status={alert.status} />
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-white truncate">{alert.action}</p>
                          <p className="text-xs text-gray-500 truncate">{alert.details}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-xs font-mono text-gray-500">{alert.ipAddress}</p>
                        <p className="text-xs text-gray-600">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
