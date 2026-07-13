import React, { useState } from 'react';
import { Shield, Lock, User, Terminal } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed. Check your credentials.');
      }

      const data = await response.json();
      localStorage.setItem('gateway_token', data.access_token);
      localStorage.setItem('gateway_role', data.role);
      localStorage.setItem('gateway_user', data.username);
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-bg px-4 relative scanline">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/10 via-terminal-bg to-terminal-bg pointer-events-none" />
      
      <div className="w-full max-w-md bg-terminal-card border border-terminal-border rounded-xl p-8 glow-cyan relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-cyan-950/30 rounded-full border border-terminal-accent/30 text-terminal-accent mb-4">
            <Shield className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wider">SECURE LLM GATEWAY</h1>
          <p className="text-sm text-slate-400 mt-1">Prompt Injection & Sandbox Security Shield</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/30 border border-terminal-error/30 text-terminal-error text-xs rounded-lg flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-terminal-border rounded-lg py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-terminal-accent transition-all text-sm"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-terminal-border rounded-lg py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-terminal-accent transition-all text-sm"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-terminal-bg text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                <span>Initialize Gateway Console</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-600 border-t border-terminal-border/40 pt-4">
          <p>Demo Credentials: <b>admin</b> / <b>admin123</b> (Full Admin)</p>
          <p className="mt-1">or <b>operator</b> / <b>operator123</b> (Policy Operator)</p>
        </div>
      </div>
    </div>
  );
}
