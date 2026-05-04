import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Login() {
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [otpDemo, setOtpDemo] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleCredentials = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', form);
      setSessionToken(res.data.data.sessionToken);
      if (res.data.data.otpSimulated) setOtpDemo(res.data.data.otpSimulated);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-otp', { otp, sessionToken });
      login(res.data.data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wide">ZERO TRUST LOGIN</h1>
          <p className="text-gray-500 text-sm mt-1">Identity verification required</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${step === 'credentials' ? 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400' : 'border-gray-700 text-gray-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${step !== 'credentials' ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
            01 CREDENTIALS
          </div>
          <div className="w-6 border-t border-gray-700" />
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${step === 'otp' ? 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400' : 'border-gray-700 text-gray-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${step === 'otp' ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
            02 MFA VERIFY
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1.5">EMAIL ADDRESS</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="admin@ztna.local"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1.5">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} required
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-gray-950 font-bold font-mono py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                {loading ? <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" /> : <>AUTHENTICATE <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTP} className="flex flex-col gap-4">
              {otpDemo && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-mono">
                  <CheckCircle className="w-4 h-4" />
                  <span>Demo OTP: <strong className="text-white">{otpDemo}</strong></span>
                </div>
              )}
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1.5">6-DIGIT OTP</label>
                <input
                  type="text" required maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xl text-center text-white font-mono tracking-[0.5em] focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="000000"
                />
                <p className="text-xs font-mono text-gray-600 mt-1.5">OTP expires in 5 minutes</p>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/40 text-gray-950 font-bold font-mono py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                {loading ? <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" /> : <>VERIFY IDENTITY <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setError(''); }}
                className="text-xs font-mono text-gray-500 hover:text-gray-300 text-center transition-colors">
                ← Back to credentials
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs font-mono text-gray-600 mt-4">
          No account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">REQUEST ACCESS</Link>
        </p>
      </div>
    </div>
  );
}
