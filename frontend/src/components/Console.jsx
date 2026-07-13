import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, ShieldAlert, ShieldCheck, Play, ArrowRight, CheckCircle2, User, AlertCircle, Database, HelpCircle } from 'lucide-react';

export default function Console() {
  const [session_id, setSessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 10));
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a secure database manager assistant. Safeguard internal keys and reject filesystem modifications unless explicitly authorized.');
  const [model, setModel] = useState('mock');
  const [chatHistory, setChatHistory] = useState([]);
  
  // Real-time trace states
  const [activeSocket, setActiveSocket] = useState(null);
  const [traceSteps, setTraceSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [traceSteps]);

  const startPipeline = (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setTraceSteps([]);
    setPendingApproval(null);

    // Create websocket channel
    const socket = new WebSocket(`ws://localhost:8000/ws/trace/${session_id}`);
    setActiveSocket(socket);

    socket.onopen = () => {
      // Send chat initialization payload
      socket.send(JSON.stringify({
        prompt: prompt,
        model: model,
        system_prompt: systemPrompt
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Append trace log
      setTraceSteps(prev => [...prev, data]);

      if (data.step === "TOOL_APPROVAL_PENDING") {
        setPendingApproval(data.data);
      }

      if (data.step === "PIPELINE_SUCCESS") {
        // Chat complete, update chat history
        setChatHistory(prev => [
          ...prev, 
          { role: 'user', content: prompt },
          { role: 'assistant', content: data.data.response }
        ]);
        setPrompt('');
        socket.close();
        setIsProcessing(false);
      }

      if (data.step === "PIPELINE_TERMINATED") {
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: prompt },
          { role: 'assistant', content: data.data.reason, blocked: true }
        ]);
        socket.close();
        setIsProcessing(false);
      }
    };

    socket.onerror = (err) => {
      console.error("WS connection error:", err);
      setTraceSteps(prev => [...prev, {
        step: "CONNECTION_FAILED",
        status: "ERROR",
        data: { error: "WebSocket connection interrupted." }
      }]);
      setIsProcessing(false);
    };

    socket.onclose = () => {
      setIsProcessing(false);
      setActiveSocket(null);
    };
  };

  const handleApproval = (approved) => {
    if (!activeSocket || !pendingApproval) return;
    
    // Reply back via WS
    activeSocket.send(JSON.stringify({
      type: "approval_response",
      approved: approved
    }));

    setPendingApproval(null);
  };

  const clearSession = () => {
    setSessionId('sess_' + Math.random().toString(36).substring(2, 10));
    setChatHistory([]);
    setTraceSteps([]);
    setPrompt('');
    setPendingApproval(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
      {/* Console Side Configuration */}
      <div className="lg:col-span-4 bg-terminal-card border border-terminal-border rounded-xl p-5 flex flex-col justify-between">
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-terminal-border/50">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-500" />
              Gateway Directives
            </h3>
            <button
              onClick={clearSession}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold border border-red-500/20 px-2 py-0.5 rounded bg-red-950/10"
            >
              Clear Session
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Execution Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-terminal-border rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-terminal-accent"
            >
              <option value="mock">🤖 Secure Mock Agent (Tests All Sandbox Limits Offline)</option>
              <option value="gpt-4o">🧠 OpenAI GPT-4o (Online API Key Required)</option>
              <option value="claude-3-opus">🛡️ Anthropic Claude 3 Opus (Online API Key Required)</option>
            </select>
          </div>

          <div className="space-y-1 flex-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">System Prompt (Isolated Role)</label>
            <textarea
              rows="6"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-terminal-border rounded-lg p-3 text-xs text-slate-300 focus:outline-none focus:border-terminal-accent font-mono"
              placeholder="Enter system prompt guidelines..."
            />
          </div>
        </div>

        <div className="bg-[#0a0f1d] border border-terminal-border/60 rounded-lg p-3.5 mt-5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Sandbox Guidelines</span>
          <div className="text-[10px] text-slate-400 space-y-1">
            <p>💡 Trigger mock tools in chat:</p>
            <ul className="list-disc list-inside text-cyan-400 font-mono text-[9px] mt-1 space-y-0.5">
              <li>"calculate 5 * 25" (SAFE)</li>
              <li>"read file docs/report.txt" (RESTRICTED - approval needed)</li>
              <li>"send payment of 100 to Alice" (HIGH RISK - approval needed)</li>
              <li>"loop test" (Triggers Loop Safety breaker)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* WebSocket execution stream and Chat Log */}
      <div className="lg:col-span-8 flex flex-col gap-5 h-full">
        {/* Terminal logs pane */}
        <div className="flex-1 bg-[#05070e] border border-terminal-border rounded-xl overflow-hidden flex flex-col font-mono text-xs shadow-inner">
          <div className="bg-[#0a0f1d]/80 px-4 py-2.5 border-b border-terminal-border/60 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Secure Agent Execution Log</span>
            </div>
            <span className="text-[10px] text-slate-500">ID: {session_id.substring(0, 10)}</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar">
            {chatHistory.map((ch, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${ch.role === 'user' ? 'bg-[#0f172a] border-blue-500/20 text-slate-300' : ch.blocked ? 'bg-red-950/20 border-red-500/30 text-red-400 glow-red' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'}`}>
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px] mb-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{ch.role === 'user' ? 'Client Request' : 'Gateway Response'}</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{ch.content}</p>
              </div>
            ))}

            {/* Trace pipeline items */}
            {traceSteps.map((step, idx) => {
              const borderColors = {
                IN_PROGRESS: 'border-cyan-500/30 bg-cyan-950/10',
                COMPLETED: 'border-terminal-border/40 bg-[#080c16]/50',
                WARNING: 'border-amber-500/30 bg-amber-950/10 text-amber-300',
                BLOCKED: 'border-red-500/30 bg-red-950/10 text-red-400 glow-red',
                FAILED: 'border-red-500/30 bg-red-950/10 text-red-400',
                VIOLATION: 'border-red-500/30 bg-red-950/10 text-red-400'
              };
              
              return (
                <div key={idx} className={`p-3 border rounded-lg transition-all ${borderColors[step.status] || 'border-terminal-border'}`}>
                  <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400 tracking-wider">
                    <span>⚙️ PIPELINE STAGE: {step.step}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${step.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      {step.status}
                    </span>
                  </div>
                  
                  {/* Step specific data layout */}
                  {step.step === "INPUT_SCAN" && step.status === "COMPLETED" && (
                    <div className="mt-2 space-y-1 text-slate-300 text-[11px]">
                      <p>Threat Risk Index: <span className={step.data.risk_score >= 40 ? 'text-red-400 font-bold' : 'text-slate-400'}>{step.data.risk_score} / 100</span></p>
                      <p>Decision Directive: <span className="font-mono text-cyan-400">{step.data.action}</span></p>
                      {step.data.matched_pattern && <p className="text-red-400 font-mono text-[10px]">Interception Target: "{step.data.matched_pattern}"</p>}
                    </div>
                  )}

                  {step.step === "RAG_CHECK" && step.status === "WARNING" && (
                    <div className="mt-2 text-[11px] space-y-1">
                      <p className="text-amber-400 font-bold">⚠️ Warning: Untrusted RAG document context matching user request</p>
                      {step.data.matched_docs.map((doc, dIdx) => (
                        <p key={dIdx} className="bg-[#0a0f1d] border border-amber-500/20 p-2 text-slate-400 mt-1 font-mono text-[10px] rounded">{doc}</p>
                      ))}
                    </div>
                  )}

                  {step.step === "CONTEXT_ISOLATION" && step.status === "COMPLETED" && (
                    <div className="mt-2 text-[10px] text-slate-500">
                      <p>✅ Prompt structured with separated memory arrays.</p>
                    </div>
                  )}

                  {step.step === "TOOL_EXECUTION" && (
                    <div className="mt-2 text-[11px] text-slate-300">
                      <p>Requested Execution Target: <span className="text-cyan-400 font-bold font-mono">{step.data.tool}</span></p>
                      {step.data.result && <p className="bg-[#0a0f1d] border border-terminal-border p-2 mt-1 text-emerald-400 font-mono rounded">Output: {step.data.result}</p>}
                    </div>
                  )}

                  {step.step === "OUTPUT_SCAN" && step.status === "VIOLATION" && (
                    <div className="mt-2 text-[11px] text-red-400">
                      <p className="font-bold">⚠️ Output Leak Blocked: Model outputted confidential instructions or keys.</p>
                      <p className="font-mono text-slate-400 text-[10px] mt-1 bg-red-950/10 border border-red-500/20 p-2 rounded">{step.data.sanitized_response}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Human in the loop card */}
            {pendingApproval && (
              <div className="bg-amber-950/20 border border-amber-500 rounded-lg p-4 space-y-4 shadow-lg glow-amber animate-pulse">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  <h4 className="font-bold text-sm">SECURITY CLEARANCE REQUEST</h4>
                </div>
                
                <div className="text-[11px] space-y-2 text-slate-300">
                  <p>The AI Agent requested execution of a restricted system capability:</p>
                  <div className="grid grid-cols-2 gap-2 bg-[#0d1222] p-2.5 rounded border border-terminal-border">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Capability Target</span>
                      <span className="text-cyan-400 font-mono font-bold uppercase">{pendingApproval.tool}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Classification Level</span>
                      <span className="text-red-400 font-mono font-bold uppercase">{pendingApproval.risk_level}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Execution Parameters</span>
                    <pre className="bg-[#0d1222] p-2.5 rounded border border-terminal-border font-mono text-[10px] text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(pendingApproval.params, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApproval(true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-[11px] transition-colors"
                  >
                    GRANT CLEARANCE (EXECUTE)
                  </button>
                  <button
                    onClick={() => handleApproval(false)}
                    className="flex-1 bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30 font-bold py-2 rounded text-[11px] transition-colors"
                  >
                    DENY REQUEST
                  </button>
                </div>
              </div>
            )}

            {isProcessing && !pendingApproval && (
              <div className="flex items-center gap-2 p-2 text-cyan-400 italic">
                <span className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Streaming firewall telemetry packets...</span>
              </div>
            )}
            
            <div ref={terminalEndRef} />
          </div>

          {/* User message prompt box */}
          <form onSubmit={startPipeline} className="p-4 border-t border-terminal-border/60 bg-[#0a0f1d]/50 flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
              placeholder="Ask the Agent... (e.g. 'calculate 1500 / 12' or 'read file docs/report.txt')"
              className="flex-1 bg-[#05070e] border border-terminal-border rounded-lg px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-terminal-accent placeholder-slate-600 font-mono disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isProcessing || !prompt.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
