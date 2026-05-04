import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Activity, Monitor, Smartphone, Globe, Clock,
  ShieldCheck, ShieldAlert, RefreshCw, TrendingUp,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { StatusBadge } from '../components/shared';
import api from '../utils/api';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatTile = ({ label, value, icon: Icon, color = 'cyan' }) => {
  const c = { cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20', red: 'text-red-400 bg-red-500/10 border-red-500/20' };
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${c[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-black text-white">{value}</p>
        <p className="text-xs font-mono text-gray-500">{label}</p>
      </div>
    </div>
  );
};

export default function DeviceActivity() {
  const [devices, setDevices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // selected deviceId

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [devRes, sesRes, logRes] = await Promise.all([
        api.get('/dashboard/devices'),
        api.get('/dashboard/sessions'),
        api.get('/dashboard/logs?limit=100'),
      ]);
      setDevices(devRes.data.data);
      setSessions(sesRes.data.data);
      setLogs(logRes.data.data.logs);
      if (devRes.data.data.length > 0) setSelected(devRes.data.data[0].deviceId);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const selDevice = devices.find(d => d.deviceId === selected);
  const devLogs = logs.filter(l => l.deviceId === selected);
  const devSessions = sessions.filter(s => s.deviceId === selected);

  // Chart data: actions by type for selected device
  const actionCounts = devLogs.reduce((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});
  const actionChart = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([action, count]) => ({ action: action.replace(/_/g, ' '), count }));

  // Status breakdown pie
  const statusCounts = devLogs.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Hourly heatmap (last 24h)
  const now = Date.now();
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now - (23 - i) * 3600000);
    const label = `${hour.getHours()}h`;
    const events = devLogs.filter(l => {
      const t = new Date(l.timestamp);
      return t >= hour && t < new Date(hour.getTime() + 3600000);
    }).length;
    return { hour: label, events };
  });

  const totalDeviceEvents = devLogs.length;
  const criticalEvents = devLogs.filter(l => l.status === 'CRITICAL').length;
  const successRate = totalDeviceEvents
    ? Math.round((devLogs.filter(l => l.status === 'SUCCESS').length / totalDeviceEvents) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Activity className="w-3 h-3" /> DEVICE ACTIVITY
            </div>
            <h1 className="text-xl font-black text-white">Per-Device Analytics</h1>
            <p className="text-gray-500 text-xs mt-0.5 font-mono">Drill into any registered device's full activity timeline</p>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs font-mono text-gray-400 hover:text-white transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Device selector sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 sticky top-20">
              <p className="text-xs font-mono text-gray-500 mb-3 px-1">SELECT DEVICE</p>
              <div className="space-y-1 max-h-[calc(100vh-160px)] overflow-y-auto">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
                  ))
                ) : devices.length === 0 ? (
                  <p className="text-xs font-mono text-gray-600 px-1">No devices registered</p>
                ) : devices.map(dev => (
                  <button key={dev.deviceId}
                    onClick={() => setSelected(dev.deviceId)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${selected === dev.deviceId ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-transparent hover:border-gray-700 hover:bg-gray-800/50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {dev.deviceType === 'mobile'
                        ? <Smartphone className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        : <Monitor className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                      <span className="text-xs font-mono text-white truncate">{dev.os} · {dev.browser}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-500 truncate">{dev.ipAddress}</span>
                      <span className={`text-xs font-mono font-bold ${dev.isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                        {dev.isBlocked ? 'BLK' : `${dev.trustScore}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-4">
            {!selDevice ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center text-gray-600 font-mono text-sm">
                <Monitor className="w-10 h-10 mx-auto mb-3 opacity-30" />
                Select a device to view its activity
              </div>
            ) : (
              <>
                {/* Device info card */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      {selDevice.deviceType === 'mobile'
                        ? <Smartphone className="w-6 h-6 text-cyan-400" />
                        : <Monitor className="w-6 h-6 text-cyan-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-base font-black text-white">{selDevice.os} — {selDevice.browser}</h2>
                        {selDevice.isBlocked
                          ? <span className="px-2 py-0.5 rounded text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/20">BLOCKED</span>
                          : <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-gray-500">
                        <span><Globe className="w-3 h-3 inline mr-1" />{selDevice.ipAddress}</span>
                        <span><Clock className="w-3 h-3 inline mr-1" />First seen: {new Date(selDevice.firstSeen).toLocaleDateString()}</span>
                        <span><Clock className="w-3 h-3 inline mr-1" />Last seen: {new Date(selDevice.lastSeen).toLocaleDateString()}</span>
                        <span>{selDevice.loginCount} total logins</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selDevice.isBlocked
                        ? <ShieldAlert className="w-6 h-6 text-red-400" />
                        : <ShieldCheck className="w-6 h-6 text-emerald-400" />}
                      <div>
                        <p className="text-lg font-black text-white">{selDevice.trustScore}</p>
                        <p className="text-xs font-mono text-gray-500">TRUST</p>
                      </div>
                    </div>
                  </div>
                  {/* Trust bar */}
                  <div className="mt-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${selDevice.trustScore >= 70 ? 'bg-emerald-400' : selDevice.trustScore >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${selDevice.trustScore}%` }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatTile label="TOTAL EVENTS" value={totalDeviceEvents} icon={Activity} color="cyan" />
                  <StatTile label="SUCCESS RATE" value={`${successRate}%`} icon={TrendingUp} color="emerald" />
                  <StatTile label="CRITICAL" value={criticalEvents} icon={ShieldAlert} color="red" />
                  <StatTile label="SESSIONS" value={devSessions.length} icon={Clock} color="amber" />
                </div>

                {/* Charts row */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Action breakdown bar */}
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs font-mono text-gray-500 mb-1">ACTION BREAKDOWN</p>
                    <h3 className="text-sm font-bold text-white mb-3">Top Actions</h3>
                    {actionChart.length === 0
                      ? <p className="text-xs font-mono text-gray-600 py-8 text-center">No data for this device</p>
                      : <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={actionChart} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <XAxis dataKey="action" tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'monospace' }} />
                            <YAxis tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'monospace' }} />
                            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }} />
                            <Bar dataKey="count" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                    }
                  </div>

                  {/* Status pie */}
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs font-mono text-gray-500 mb-1">STATUS DISTRIBUTION</p>
                    <h3 className="text-sm font-bold text-white mb-3">Event Outcomes</h3>
                    {pieData.length === 0
                      ? <p className="text-xs font-mono text-gray-600 py-8 text-center">No data for this device</p>
                      : <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                          </PieChart>
                        </ResponsiveContainer>
                    }
                  </div>
                </div>

                {/* Hourly heatmap */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs font-mono text-gray-500 mb-1">ACTIVITY HEATMAP</p>
                  <h3 className="text-sm font-bold text-white mb-3">Last 24 Hours</h3>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="hour" tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'monospace' }} interval={2} />
                      <YAxis tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }} />
                      <Bar dataKey="events" radius={[2, 2, 0, 0]}>
                        {hourlyData.map((entry, i) => (
                          <Cell key={i} fill={entry.events > 3 ? '#ef4444' : entry.events > 0 ? '#06b6d4' : '#1f2937'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-gray-700" /><span className="text-xs font-mono text-gray-600">No activity</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-cyan-500" /><span className="text-xs font-mono text-gray-600">Normal</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500" /><span className="text-xs font-mono text-gray-600">High (3+)</span></div>
                  </div>
                </div>

                {/* Session history */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-mono">SESSION HISTORY</h3>
                    <span className="text-xs font-mono text-gray-500">{devSessions.length} sessions</span>
                  </div>
                  {devSessions.length === 0 ? (
                    <p className="text-xs font-mono text-gray-600 p-6 text-center">No session data for this device</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          {['CREATED', 'MFA', 'SUSPICIOUS', 'IP', 'STATUS'].map(h => (
                            <th key={h} className="px-4 py-2 text-left text-xs font-mono font-bold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {devSessions.map(s => (
                          <tr key={s._id} className={`border-b border-gray-800/50 ${s.isSuspicious ? 'bg-red-500/5' : ''}`}>
                            <td className="px-4 py-2 text-xs font-mono text-gray-400">{new Date(s.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs font-mono ${s.mfaVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {s.mfaVerified ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {s.isSuspicious ? <StatusBadge status="CRITICAL" /> : <span className="text-xs text-gray-600">—</span>}
                            </td>
                            <td className="px-4 py-2 text-xs font-mono text-gray-500">{s.ipAddress}</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs font-mono ${s.isActive ? 'text-emerald-400' : 'text-gray-600'}`}>
                                {s.isActive ? 'ACTIVE' : s.terminationReason?.toUpperCase() || 'ENDED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Recent event log for device */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-mono">RECENT EVENTS</h3>
                    <span className="text-xs font-mono text-gray-500">{devLogs.length} events</span>
                  </div>
                  {devLogs.length === 0 ? (
                    <p className="text-xs font-mono text-gray-600 p-6 text-center">No event data for this device</p>
                  ) : (
                    <div className="divide-y divide-gray-800/50 max-h-72 overflow-y-auto">
                      {devLogs.slice(0, 20).map((log, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/30 transition-colors">
                          <StatusBadge status={log.status} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-white">{log.action}</p>
                            <p className="text-xs text-gray-500 truncate">{log.details || '—'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-mono text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            <p className={`text-xs font-mono font-bold ${log.riskScore >= 70 ? 'text-red-400' : log.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              R:{log.riskScore}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
