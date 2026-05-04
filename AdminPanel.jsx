import React, { useState, useEffect } from 'react';
import { Settings, Users, Activity, Shield, ToggleLeft, ToggleRight, RefreshCw, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { StatusBadge } from '../components/shared';
import api from '../utils/api';

export default function AdminPanel() {
  const [systemStats, setSystemStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, sessionsRes] = await Promise.all([
        api.get('/admin/system-stats'),
        api.get('/admin/users?limit=50'),
        api.get('/dashboard/sessions'),
      ]);
      setSystemStats(statsRes.data.data);
      setUsers(usersRes.data.data.users);
      setSessions(sessionsRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleUser = async (userId) => {
    await api.patch(`/admin/users/${userId}/toggle`);
    fetchData();
  };

  const changeRole = async (userId, role) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    fetchData();
  };

  const terminateSession = async (sessionId) => {
    await api.delete(`/admin/sessions/${sessionId}`);
    fetchData();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'sessions', label: 'Sessions', icon: Shield },
    { id: 'alerts', label: 'Critical Alerts', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto px-4 pb-12">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <Settings className="w-3 h-3" /> ADMIN PANEL
            </div>
            <h1 className="text-xl font-black text-white">System Control Center</h1>
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs font-mono text-gray-400 hover:text-white transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono transition-all ${activeTab === id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && systemStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'TOTAL USERS', value: systemStats.users.total, color: 'text-cyan-400' },
              { label: 'ACTIVE USERS', value: systemStats.users.active, color: 'text-emerald-400' },
              { label: 'TOTAL DEVICES', value: systemStats.devices.total, color: 'text-blue-400' },
              { label: 'BLOCKED DEVICES', value: systemStats.devices.blocked, color: 'text-red-400' },
              { label: 'ACTIVE SESSIONS', value: systemStats.sessions.active, color: 'text-amber-400' },
              { label: 'CRITICAL EVENTS', value: systemStats.logs.critical, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                <p className={`text-2xl font-black mb-1 ${color}`}>{value}</p>
                <p className="text-xs font-mono text-gray-500">{label}</p>
              </div>
            ))}

            {/* Action breakdown */}
            <div className="col-span-2 md:col-span-3 lg:col-span-6 bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white font-mono mb-4">TOP ACTIONS</h3>
              <div className="space-y-2">
                {systemStats.actionBreakdown.map(({ _id, count }) => {
                  const pct = Math.round((count / systemStats.logs.total) * 100);
                  return (
                    <div key={_id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-400 w-44 flex-shrink-0">{_id}</span>
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-gray-500 w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['USERNAME', 'EMAIL', 'ROLE', 'STATUS', 'TRUST', 'LAST LOGIN', 'ACTIONS'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono font-bold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-white">{u.username}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500">
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${u.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-cyan-400">{u.trustScore}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUser(u._id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border transition-colors hover:bg-gray-700 text-gray-400 border-gray-700">
                        {u.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {u.isActive ? 'DISABLE' : 'ENABLE'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sessions */}
        {activeTab === 'sessions' && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-mono text-sm">No active sessions</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['USER', 'IP ADDRESS', 'MFA', 'SUSPICIOUS', 'CREATED', 'ACTIONS'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-mono font-bold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s._id} className={`border-b border-gray-800/50 ${s.isSuspicious ? 'bg-red-500/5' : ''}`}>
                      <td className="px-4 py-3 text-xs font-mono text-white">{s.userId?.username || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{s.ipAddress}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono ${s.mfaVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {s.mfaVerified ? '✓ VERIFIED' : '✗ PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.isSuspicious && <StatusBadge status="CRITICAL" />}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => terminateSession(s._id)}
                          className="px-2 py-1 rounded text-xs font-mono border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                          TERMINATE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Critical Alerts */}
        {activeTab === 'alerts' && systemStats && (
          <div className="space-y-2">
            {systemStats.recentCritical.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-mono text-sm bg-gray-900/50 border border-gray-800 rounded-xl">
                No critical events
              </div>
            ) : systemStats.recentCritical.map((log) => (
              <div key={log._id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-red-400 font-bold">{log.action}</span>
                    <StatusBadge status={log.status} />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{log.details}</p>
                  <p className="text-xs font-mono text-gray-600 mt-0.5">{log.ipAddress} · {new Date(log.timestamp).toLocaleString()}</p>
                </div>
                <span className="text-xs font-mono text-red-400 font-bold">RISK: {log.riskScore}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
