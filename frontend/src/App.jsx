import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, Terminal, Settings2, Flame, LogOut, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Console from './components/Console';
import PolicyEditor from './components/PolicyEditor';
import AttackLab from './components/AttackLab';
import RedVsBlue from './components/RedVsBlue';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('gateway_token'));
  const [role, setRole] = useState(() => localStorage.getItem('gateway_role'));
  const [username, setUsername] = useState(() => localStorage.getItem('gateway_user'));
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const handleLogin = (data) => {
    setToken(data.access_token);
    setRole(data.role);
    setUsername(data.username);
  };

  const handleLogout = () => {
    localStorage.removeItem('gateway_token');
    localStorage.removeItem('gateway_role');
    localStorage.removeItem('gateway_user');
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  // If unauthorized, show login gateway
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'console', label: 'Security Console', icon: Terminal },
    { id: 'policies', label: 'Firewall Policies', icon: Settings2 },
    { id: 'attack', label: 'Attack Lab', icon: Flame },
    { id: 'redblue', label: 'Red vs Blue Lab', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col md:flex-row relative">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-terminal-card border-b md:border-b-0 md:border-r border-terminal-border flex flex-col justify-between z-10 shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-terminal-border/60 flex items-center gap-3">
            <div className="p-2 bg-cyan-950/40 border border-terminal-accent/30 text-terminal-accent rounded-lg">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-widest text-slate-100 uppercase">LLM Shield</h1>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Integration Hub</span>
            </div>
          </div>

          {/* Tab Navigation items */}
          <nav className="p-4 space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${isActive ? 'bg-cyan-600 text-white font-bold glow-cyan shadow' : 'text-slate-400 hover:bg-[#141c30] hover:text-slate-200'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Identity and Logout */}
        <div className="p-4 border-t border-terminal-border/60 bg-[#0e1424]/60">
          <div className="flex items-center justify-between gap-3 text-xs mb-3">
            <div className="flex flex-col">
              <span className="font-bold text-slate-200 truncate">{username}</span>
              <span className="text-[10px] text-slate-500 font-mono capitalize">Role: {role}</span>
            </div>
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Active
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto z-10 max-h-screen">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'console' && <Console />}
        {activeTab === 'policies' && <PolicyEditor />}
        {activeTab === 'attack' && <AttackLab />}
        {activeTab === 'redblue' && <RedVsBlue />}
      </main>
    </div>
  );
}

export default App;
