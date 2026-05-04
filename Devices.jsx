import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Shield, ShieldOff, Wifi, Clock, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DeviceIcon = ({ type }) => {
  if (type === 'mobile') return <Smartphone className="w-4 h-4 text-cyan-400" />;
  return <Monitor className="w-4 h-4 text-cyan-400" />;
};

export default function Devices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/devices');
      setDevices(res.data.data);
    } finally { setLoading(false); }
  };

  const handleBlock = async (deviceId) => {
    if (!window.confirm('Block this device?')) return;
    await api.patch(`/admin/devices/${deviceId}/block`, { reason: 'Admin blocked via dashboard' });
    fetchDevices();
  };

  useEffect(() => { fetchDevices(); }, []);

  const trustColor = (score) => score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto px-4 pb-12">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Monitor className="w-3 h-3" /> DEVICE REGISTRY
            </div>
            <h1 className="text-xl font-black text-white">Connected Devices</h1>
            <p className="text-gray-500 text-xs mt-0.5 font-mono">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button onClick={fetchDevices} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs font-mono text-gray-400 hover:text-white transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-20 text-gray-600 font-mono">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No devices registered</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div key={device._id} className={`bg-gray-900/50 border rounded-xl p-5 transition-colors ${device.isBlocked ? 'border-red-500/30 bg-red-500/5' : 'border-gray-800 hover:border-gray-700'}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <DeviceIcon type={device.deviceType} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{device.os} · {device.browser}</p>
                      <p className="text-xs font-mono text-gray-500">{device.deviceType}</p>
                    </div>
                  </div>
                  {device.isBlocked ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/20">
                      <ShieldOff className="w-3 h-3" /> BLOCKED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Wifi className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-500">IP ADDRESS</span>
                    <span className="text-gray-300">{device.ipAddress}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-500">LOGINS</span>
                    <span className="text-gray-300">{device.loginCount}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-500">TRUST SCORE</span>
                    <span className={`font-bold ${trustColor(device.trustScore)}`}>{device.trustScore}/100</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono text-gray-500">
                    <Clock className="w-3 h-3" />
                    Last seen: {new Date(device.lastSeen).toLocaleDateString()}
                  </div>
                </div>

                {/* Trust bar */}
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all ${device.trustScore >= 70 ? 'bg-emerald-400' : device.trustScore >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${device.trustScore}%` }} />
                </div>

                {/* User */}
                {device.userId && (
                  <p className="text-xs font-mono text-gray-500 truncate">
                    <span className="text-gray-600">USER: </span>{device.userId.username || device.userId}
                  </p>
                )}

                {/* Block button (admin only) */}
                {user?.role === 'admin' && !device.isBlocked && (
                  <button onClick={() => handleBlock(device.deviceId)}
                    className="mt-3 w-full py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-mono transition-colors">
                    BLOCK DEVICE
                  </button>
                )}
                {device.isBlocked && device.blockedReason && (
                  <p className="text-xs font-mono text-red-400 mt-2">Reason: {device.blockedReason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
