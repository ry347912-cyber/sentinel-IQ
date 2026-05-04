import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { StatusBadge } from '../components/shared';
import api from '../utils/api';

const ACTION_TYPES = [
  '', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER',
  'OTP_SENT', 'OTP_VERIFIED', 'OTP_FAILED', 'SUSPICIOUS_ACTIVITY',
  'SESSION_TERMINATED', 'PERMISSION_DENIED', 'ADMIN_ACTION',
];

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', action: '', search: '' });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const res = await api.get(`/dashboard/logs?${params}`);
      setLogs(res.data.data.logs);
      setTotal(res.data.data.total);
      setPages(res.data.data.pages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilter = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const riskColor = (score) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto px-4 pb-12">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <ScrollText className="w-3 h-3" /> ACCESS LOGS
            </div>
            <h1 className="text-xl font-black text-white">Audit Trail</h1>
            <p className="text-gray-500 text-xs mt-0.5 font-mono">{total.toLocaleString()} total events</p>
          </div>
          <button onClick={fetchLogs} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-xs font-mono text-gray-400 hover:text-white transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={filters.search}
              onChange={e => handleFilter('search', e.target.value)}
              placeholder="Search IP, user, details..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <select value={filters.status} onChange={e => handleFilter('status', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors">
            <option value="">ALL STATUS</option>
            {['SUCCESS', 'FAILURE', 'WARNING', 'CRITICAL'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.action} onChange={e => handleFilter('action', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors">
            {ACTION_TYPES.map(a => <option key={a} value={a}>{a || 'ALL ACTIONS'}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  {['TIMESTAMP', 'USER', 'ACTION', 'STATUS', 'IP ADDRESS', 'RISK', 'DETAILS'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-mono font-bold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-800 rounded animate-pulse w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-600 font-mono text-sm">No logs found</td></tr>
                ) : logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-300">
                      {log.username || log.userId?.username || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-cyan-300">{log.action}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ipAddress || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono font-bold ${riskColor(log.riskScore)}`}>{log.riskScore}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <span className="text-xs font-mono text-gray-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
