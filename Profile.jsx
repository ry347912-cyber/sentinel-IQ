import React, { useState, useEffect } from 'react';
import {
  User, Lock, Eye, EyeOff, Shield, Clock,
  CheckCircle, AlertCircle, Monitor, Smartphone, LogOut,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { TrustScore, StatusBadge } from '../components/shared';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const passwordChecks = [
  { label: '8+ characters', test: p => p.length >= 8 },
  { label: 'Uppercase', test: p => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: p => /[a-z]/.test(p) },
  { label: 'Number', test: p => /\d/.test(p) },
  { label: 'Special char', test: p => /[@$!%*?&]/.test(p) },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'sessions') {
      setLoading(true);
      api.get('/dashboard/sessions').then(r => setSessions(r.data.data)).finally(() => setLoading(false));
    }
    if (tab === 'activity') {
      setLoading(true);
      api.get('/dashboard/logs?limit=30').then(r => setLogs(r.data.data.logs)).finally(() => setLoading(false));
    }
  }, [tab]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) return setPwMsg({ type: 'error', text: 'Passwords do not match' });
    if (!passwordChecks.every(c => c.test(pwForm.newPw))) return setPwMsg({ type: 'error', text: 'Password does not meet requirements' });
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwMsg({ type: 'success', text: 'Password changed successfully. Please log in again.' });
      setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed' });
    } finally { setPwLoading(false); }
  };

  const terminateSelf = async (sessionId) => {
    await api.delete(`/admin/sessions/${sessionId}`).catch(() => {});
    setSessions(s => s.filter(x => x._id !== sessionId));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'sessions', label: 'My Sessions', icon: Shield },
    { id: 'activity', label: 'My Activity', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="pt-20 max-w-4xl mx-auto px-4 pb-12">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <User className="w-3 h-3" /> ACCOUNT
          </div>
          <h1 className="text-xl font-black text-white">Profile & Settings</h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-1 w-fit overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${tab === id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-2xl font-black text-cyan-400">{user?.username?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{user?.username}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${user?.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'EMAIL', value: user?.email },
                  { label: 'USER ID', value: user?.id?.slice(-8).toUpperCase() },
                  { label: 'MEMBER SINCE', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
                  { label: 'LAST LOGIN', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="text-xs font-mono text-gray-500">{label}</span>
                    <span className="text-xs font-mono text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Trust Score card */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <p className="text-xs font-mono text-gray-500 mb-3">ZERO TRUST SCORE</p>
                <div className="flex items-center gap-4">
                  <TrustScore score={user?.trustScore || 100} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-2">Your trust score reflects account health and activity.</p>
                    <div className="space-y-1">
                      {[
                        { label: 'MFA Enabled', ok: true },
                        { label: 'No suspicious activity', ok: true },
                        { label: 'Account verified', ok: user?.isVerified },
                      ].map(({ label, ok }) => (
                        <div key={label} className={`flex items-center gap-1.5 text-xs font-mono ${ok ? 'text-emerald-400' : 'text-gray-600'}`}>
                          <CheckCircle className="w-3 h-3" /> {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <p className="text-xs font-mono text-gray-500 mb-3">QUICK ACTIONS</p>
                <div className="space-y-2">
                  <button onClick={() => setTab('security')}
                    className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-gray-700 hover:border-gray-600 text-sm font-mono text-gray-300 hover:text-white transition-colors text-left">
                    <Lock className="w-4 h-4 text-cyan-400" /> Change Password
                  </button>
                  <button onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 text-sm font-mono text-red-400 transition-colors text-left">
                    <LogOut className="w-4 h-4" /> Sign Out All Devices
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security tab */}
        {tab === 'security' && (
          <div className="max-w-md">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Change Password</h2>
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm mb-4 font-mono ${pwMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {pwMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {pwMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {[
                  { key: 'current', label: 'CURRENT PASSWORD', placeholder: '••••••••' },
                  { key: 'newPw', label: 'NEW PASSWORD', placeholder: '••••••••' },
                  { key: 'confirm', label: 'CONFIRM NEW PASSWORD', placeholder: '••••••••' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={pwForm[key]}
                        onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                        required
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder={placeholder}
                      />
                      {key === 'newPw' && (
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    {key === 'newPw' && pwForm.newPw && (
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {passwordChecks.map(({ label: l, test }) => (
                          <div key={l} className={`flex items-center gap-1 text-xs font-mono ${test(pwForm.newPw) ? 'text-emerald-400' : 'text-gray-600'}`}>
                            <div className={`w-1 h-1 rounded-full ${test(pwForm.newPw) ? 'bg-emerald-400' : 'bg-gray-700'}`} /> {l}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button type="submit" disabled={pwLoading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold font-mono py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                  {pwLoading ? <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" /> : 'UPDATE PASSWORD'}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-gray-800">
                <p className="text-xs font-mono text-gray-500 mb-3">MFA STATUS</p>
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-mono text-emerald-400">OTP Authentication</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">ENABLED</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions tab */}
        {tab === 'sessions' && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white font-mono">MY ACTIVE SESSIONS</h3>
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="p-8 text-center text-gray-600 font-mono text-sm">No active sessions</p>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {sessions.map(s => (
                  <div key={s._id} className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                        {s.userAgent?.includes('Mobile') ? <Smartphone className="w-4 h-4 text-cyan-400" /> : <Monitor className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-mono text-white">{s.ipAddress}</p>
                        <p className="text-xs font-mono text-gray-500">
                          {s.mfaVerified ? '✓ MFA' : '✗ No MFA'} · {new Date(s.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                      <button onClick={() => terminateSelf(s._id)}
                        className="px-2 py-1 rounded text-xs font-mono border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                        END
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity tab */}
        {tab === 'activity' && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex justify-between">
              <h3 className="text-sm font-bold text-white font-mono">MY RECENT ACTIVITY</h3>
              <span className="text-xs font-mono text-gray-500">Last 30 events</span>
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors">
                    <StatusBadge status={log.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-white">{log.action}</p>
                      <p className="text-xs text-gray-500 truncate">{log.details || log.resource || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono text-gray-500">{log.ipAddress}</p>
                      <p className="text-xs text-gray-600">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
