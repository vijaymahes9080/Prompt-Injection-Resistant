import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, BarChart3, Clock, DollarSign, Database, AlertTriangle, Cpu } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetricsAndLogs = async () => {
    try {
      const token = localStorage.getItem('gateway_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const metricsRes = await fetch('http://localhost:8000/api/audit/metrics', { headers });
      const logsRes = await fetch('http://localhost:8000/api/audit/logs?limit=15', { headers });
      
      if (metricsRes.ok && logsRes.ok) {
        const metricsData = await metricsRes.ok ? await metricsRes.json() : null;
        const logsData = await logsRes.ok ? await logsRes.json() : [];
        setMetrics(metricsData);
        setLogs(logsData);
      }
    } catch (err) {
      console.error("Failed to retrieve dashboard telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricsAndLogs();
    const interval = setInterval(fetchMetricsAndLogs, 5000); // Autorefresh metrics every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const {
    total_requests = 0,
    total_blocked = 0,
    total_rewrites = 0,
    average_risk_score = 0,
    threat_breakdown = {},
    total_tokens = 0,
    total_cost = 0.0,
    history = []
  } = metrics || {};

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-terminal-card border border-terminal-border rounded-xl p-5 glow-cyan relative overflow-hidden">
          <div className="absolute right-2 -bottom-2 opacity-5 text-cyan-400">
            <Shield className="w-24 h-24" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transactions</p>
          <p className="text-3xl font-extrabold text-cyan-400 mt-2">{total_requests}</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>Passed through gateway firewall</span>
          </div>
        </div>

        <div className="bg-terminal-card border border-terminal-border rounded-xl p-5 glow-red relative overflow-hidden">
          <div className="absolute right-2 -bottom-2 opacity-5 text-red-500">
            <ShieldAlert className="w-24 h-24" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Injections Blocked</p>
          <p className="text-3xl font-extrabold text-red-500 mt-2">
            {total_blocked} <span className="text-xs font-medium text-slate-500">({total_requests ? ((total_blocked / total_requests) * 100).toFixed(1) : 0}%)</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Active jailbreaks intercepted</span>
          </div>
        </div>

        <div className="bg-terminal-card border border-terminal-border rounded-xl p-5 glow-amber relative overflow-hidden">
          <div className="absolute right-2 -bottom-2 opacity-5 text-amber-500">
            <BarChart3 className="w-24 h-24" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Risk Score</p>
          <p className="text-3xl font-extrabold text-amber-500 mt-2">{average_risk_score} <span className="text-xs font-medium text-slate-500">/ 100</span></p>
          <div className="w-full bg-[#0a0f1d] rounded-full h-1.5 mt-4 overflow-hidden border border-terminal-border/40">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${average_risk_score}%` }} />
          </div>
        </div>

        <div className="bg-terminal-card border border-terminal-border rounded-xl p-5 glow-cyan relative overflow-hidden">
          <div className="absolute right-2 -bottom-2 opacity-5 text-cyan-400">
            <DollarSign className="w-24 h-24" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost Savings</p>
          <p className="text-3xl font-extrabold text-terminal-success mt-2">${(total_blocked * 0.15 + total_rewrites * 0.05).toFixed(2)}</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <DollarSign className="w-3.5 h-3.5 text-terminal-success" />
            <span>Tokens saved: {total_tokens} (${total_cost.toFixed(2)} spent)</span>
          </div>
        </div>
      </div>

      {/* Charts & Threat breakdown grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sparklines group */}
        <div className="lg:col-span-2 bg-terminal-card border border-terminal-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            Daily Firewall Traffic
          </h2>
          
          <div className="h-44 flex items-end justify-between gap-2 px-2 pt-2 border-b border-terminal-border/40">
            {history.map((h, i) => {
              const maxReq = Math.max(...history.map(x => x.requests), 1);
              const reqHeight = (h.requests / maxReq) * 85;
              const blockHeight = (h.blocked / maxReq) * 85;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-12 scale-0 group-hover:scale-100 transition-all bg-[#080b16] border border-terminal-border text-[10px] text-slate-300 p-1.5 rounded z-20 whitespace-nowrap glow-cyan">
                    Reqs: {h.requests} | Blocked: {h.blocked}
                  </div>
                  
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div className="w-4 bg-cyan-600/30 border border-cyan-500/50 rounded-t" style={{ height: `${Math.max(reqHeight, 5)}%` }} />
                    <div className="w-4 bg-red-600/30 border border-red-500/50 rounded-t" style={{ height: `${Math.max(blockHeight, 2)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase mt-2">{h.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Threat Class breakdown */}
        <div className="bg-terminal-card border border-terminal-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-5 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Threat Breakdowns
          </h2>
          <div className="space-y-4">
            {Object.entries(threat_breakdown).map(([key, count]) => {
              const totalThreats = Object.values(threat_breakdown).reduce((a, b) => a + b, 0) || 1;
              const percent = ((count / totalThreats) * 100).toFixed(0);
              const colorMap = {
                direct_injection: 'bg-red-500',
                jailbreak: 'bg-orange-500',
                leakage: 'bg-amber-500',
                role_confusion: 'bg-yellow-500',
                nested_instruction: 'bg-purple-500',
                unicode_obfuscation: 'bg-cyan-500'
              };
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-slate-300 font-semibold">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#0a0f1d] rounded-full h-2 border border-terminal-border/30">
                    <div className={`h-2 rounded-full ${colorMap[key] || 'bg-slate-500'}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-terminal-border/50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-500" />
            Firewall Transactions (Audit Logs)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-terminal-border bg-cyan-950/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Prompt Payload</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/40 text-slate-300">
              {logs.map((log) => {
                const actionStyles = {
                  REJECT: 'bg-red-950/40 text-red-500 border-red-500/30',
                  REWRITE: 'bg-amber-950/40 text-amber-500 border-amber-500/30',
                  ALLOW: 'bg-emerald-950/40 text-emerald-500 border-emerald-500/30',
                };
                return (
                  <tr key={log.id} className="hover:bg-[#141d33] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{log.session_id.substring(0, 8)}...</td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono">{log.prompt_payload}</td>
                    <td className="py-3 px-4 font-bold">
                      <span className={log.risk_score >= 70 ? 'text-red-500' : log.risk_score >= 40 ? 'text-amber-500' : 'text-slate-400'}>
                        {log.risk_score}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold tracking-wide ${actionStyles[log.firewall_action] || 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                        {log.firewall_action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No transactions captured. Speak with the agent console to generate threat streams.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Inspector Dialog */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-terminal-card border border-terminal-border rounded-xl overflow-hidden glow-cyan max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-terminal-border flex justify-between items-center bg-[#0d1222]">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Telemetry Inspector (ID: {selectedLog.id})
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-semibold">Timestamp</p>
                  <p className="text-slate-200 mt-1 font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-semibold">Firewall Action</p>
                  <p className="text-slate-200 mt-1 font-mono font-bold">{selectedLog.firewall_action}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-semibold">Threat Risk Index</p>
                  <p className="text-slate-200 mt-1 font-mono font-bold">{selectedLog.risk_score} / 100</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-semibold">LLM Cost / Memory</p>
                  <p className="text-slate-200 mt-1 font-mono">${selectedLog.cost.toFixed(4)} spent</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 uppercase tracking-wider font-semibold">User Query Input</p>
                <div className="bg-[#0a0f1d] border border-terminal-border rounded p-3 text-slate-300 font-mono mt-1 break-all whitespace-pre-wrap">
                  {selectedLog.prompt_payload}
                </div>
              </div>

              {selectedLog.sanitized_payload && (
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-semibold">Gateway Rewritten Sandbox Payload</p>
                  <div className="bg-[#070b14] border border-terminal-border rounded p-3 text-slate-400 font-mono mt-1 break-all whitespace-pre-wrap">
                    {selectedLog.sanitized_payload}
                  </div>
                </div>
              )}

              {selectedLog.threat_events && selectedLog.threat_events.length > 0 && (
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-semibold">Threat Details</p>
                  <div className="space-y-2 mt-1">
                    {selectedLog.threat_events.map((te, idx) => (
                      <div key={idx} className="bg-red-950/20 border border-red-500/20 p-2.5 rounded text-red-400 flex flex-col gap-1">
                        <span className="font-bold uppercase tracking-wider text-[10px]">Threat: {te.threat_type} (Risk: {te.risk_score})</span>
                        <span className="font-mono text-[10px]">Pattern matched: {te.matched_pattern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-slate-500 uppercase tracking-wider font-semibold">Gate Response Output</p>
                <div className="bg-[#0a0f1d] border border-terminal-border rounded p-3 text-emerald-400 font-mono mt-1 break-all whitespace-pre-wrap">
                  {selectedLog.response_payload || "No response recorded."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
