import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Zap, ChevronRight, Server, Key, Activity } from 'lucide-react';

const principles = [
  { icon: Shield, title: 'Never Trust, Always Verify', desc: 'Every access request is authenticated, authorized, and continuously validated regardless of network location.' },
  { icon: Lock, title: 'Least Privilege Access', desc: 'Users get minimum permissions necessary. Role-based controls enforce strict resource boundaries.' },
  { icon: Eye, title: 'Continuous Monitoring', desc: 'Every session is monitored in real-time. Anomalous behavior triggers immediate session termination.' },
  { icon: Zap, title: 'Assume Breach', desc: 'System operates as if a breach is imminent. Every layer enforces security independently.' },
];

const features = [
  { icon: Key, label: 'Multi-Factor Authentication', sub: 'OTP + Password' },
  { icon: Server, label: 'Device Fingerprinting', sub: 'IP + User Agent Tracking' },
  { icon: Activity, label: 'Real-time Session Monitoring', sub: 'Auto-terminate on Anomaly' },
  { icon: Shield, label: 'Role-Based Access Control', sub: 'Admin / User Isolation' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-mono font-bold text-sm tracking-wider">ZTNA<span className="text-cyan-400">SYS</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-mono text-gray-400 hover:text-white transition-colors">LOGIN</Link>
            <Link to="/register" className="text-sm font-mono px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold rounded-lg transition-colors">
              GET ACCESS
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            ZERO TRUST ARCHITECTURE — PRODUCTION GRADE
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            <span className="text-white">TRUST</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">NOTHING.</span><br />
            <span className="text-white text-4xl md:text-5xl font-bold">VERIFY EVERYTHING.</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Enterprise-grade Zero Trust Network Access system with MFA, device tracking, session monitoring, and role-based access control. Built for cybersecurity-conscious organizations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold font-mono rounded-xl text-sm transition-all hover:scale-105">
              REQUEST ACCESS <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="flex items-center justify-center gap-2 px-8 py-3.5 border border-gray-700 hover:border-cyan-500/50 text-gray-300 font-mono rounded-xl text-sm transition-all hover:bg-gray-800">
              SIGN IN <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features row */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-cyan-500/30 transition-colors">
              <Icon className="w-5 h-5 text-cyan-400 mb-3" />
              <p className="text-white text-xs font-bold mb-1">{label}</p>
              <p className="text-gray-500 text-xs font-mono">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Zero Trust Principles */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-mono text-cyan-400 mb-2">ZERO TRUST PRINCIPLES</p>
          <h2 className="text-3xl font-black text-white">The Four Pillars</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {principles.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:border-cyan-500/40 transition-colors">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">Ready to Secure Your Network?</h2>
          <p className="text-gray-500 mb-8 text-sm">Deploy Zero Trust in minutes. No implicit trust granted.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold font-mono rounded-xl text-sm transition-all">
            START NOW <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono text-gray-600">
          <span>© 2026 ZTNA SYSTEM — Zero Trust Network Access</span>
          <span>Built with security-first architecture</span>
        </div>
      </footer>
    </div>
  );
}
