import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  FileCode, 
  UploadCloud, 
  Check, 
  Zap, 
  AlertTriangle, 
  Terminal, 
  ArrowRight, 
  AlertCircle, 
  Activity, 
  Sparkles 
} from 'lucide-react';

const MOCK_FILES = [
  { name: "normal_profile.png", size: "142 KB", type: "image/png", desc: "Standard avatar photo with no payload." },
  { name: "stego_attack.png", size: "512 KB", type: "image/png", desc: "Image containing LSB pixel prompt injection." },
  { name: "exploit_metadata.pdf", size: "85 KB", type: "application/pdf", desc: "PDF document with injection payload hidden in Author EXIF." }
];

export default function RedVsBlue() {
  // Simulator States
  const [targetGoal, setTargetGoal] = useState("retrieve the database admin password");
  const [roundsCount, setRoundsCount] = useState(5);
  const [simRunning, setSimRunning] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState("battle"); // "battle" | "stego" | "healing"
  
  // Stego States
  const [selectedFile, setSelectedFile] = useState(MOCK_FILES[0]);
  const [customFile, setCustomFile] = useState(null);
  const [stegoScanning, setStegoScanning] = useState(false);
  const [stegoResults, setStegoResults] = useState(null);

  // Healing States
  const [appliedPatches, setAppliedPatches] = useState([]);
  const [applyingPatchId, setApplyingPatchId] = useState(null);

  const runSimulation = async () => {
    setSimRunning(true);
    setSimResults(null);
    setCurrentRoundIndex(-1);
    
    try {
      const token = localStorage.getItem('gateway_token');
      const response = await fetch('http://localhost:8000/api/red-team/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_goal: targetGoal,
          rounds: Number(roundsCount)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSimResults(data);
        
        // Animate round-by-round reveal
        for (let i = 0; i < data.logs.length; i++) {
          setCurrentRoundIndex(i);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } else {
        throw new Error("Simulation endpoint failure.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimRunning(false);
    }
  };

  const handleApplyPatch = async (patch) => {
    setApplyingPatchId(patch.name);
    try {
      const token = localStorage.getItem('gateway_token');
      const response = await fetch('http://localhost:8000/api/red-team/heal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: patch.name,
          pattern: patch.pattern,
          threat_type: patch.threat_type,
          weight: patch.weight
        })
      });
      
      if (response.ok) {
        setAppliedPatches(prev => [...prev, patch.name]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingPatchId(null);
    }
  };

  const scanFile = async (fileName, contentType) => {
    setStegoScanning(true);
    setStegoResults(null);
    try {
      const token = localStorage.getItem('gateway_token');
      const response = await fetch('http://localhost:8000/api/red-team/stego-scan-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: fileName,
          content_type: contentType
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStegoResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStegoScanning(false);
    }
  };

  // Extract all generated healing patches from simulator runs
  const getSimPatches = () => {
    if (!simResults) return [];
    return simResults.logs
      .map(log => log.healing_suggestion)
      .filter(patch => patch !== null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-terminal-border/50">
        <div>
          <h1 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Red vs Blue Security Lab
          </h1>
          <p className="text-xs text-slate-400">Autonomous Red-Teaming, Steganography analysis, and Self-Healing rule compiler.</p>
        </div>
        
        <div className="flex bg-[#0b101f] border border-terminal-border rounded-lg p-1">
          <button
            onClick={() => setActiveTab("battle")}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === "battle" ? 'bg-cyan-600 text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Red Team Simulator
          </button>
          <button
            onClick={() => setActiveTab("stego")}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === "stego" ? 'bg-cyan-600 text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Stego File Scanner
          </button>
          <button
            onClick={() => setActiveTab("healing")}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === "healing" ? 'bg-cyan-600 text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Self-Healing Center ({getSimPatches().length - appliedPatches.length})
          </button>
        </div>
      </div>

      {/* Simulator Arena */}
      {activeTab === "battle" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Card */}
          <div className="lg:col-span-4 bg-terminal-card border border-terminal-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-terminal-border/50 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Attacker Simulator Settings
              </h2>
              
              <div className="space-y-4 mt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Target Intrusion Goal</label>
                  <input
                    type="text"
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-terminal-border rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                    placeholder="e.g. bypass firewall and steal API keys"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Attack Iteration Rounds</label>
                  <select
                    value={roundsCount}
                    onChange={(e) => setRoundsCount(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-terminal-border rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="3">3 Iterations</option>
                    <option value="5">5 Iterations (Recommended)</option>
                    <option value="8">8 Iterations</option>
                  </select>
                </div>

                <div className="bg-[#0b101f] border border-terminal-border p-3.5 rounded-lg text-[11px] text-slate-400 space-y-1.5">
                  <span className="font-bold text-slate-300 block uppercase text-[9px] text-cyan-400 tracking-wider">How it works:</span>
                  <p>1. The Red Teamer generates contextual prompt injections attempting to bypass your policies.</p>
                  <p>2. The Blue Team Firewall calculates regex risk scores combined with **Semantic intent vectors**.</p>
                  <p>3. If breaches succeed, self-healing code proposes rules to auto-block future bypasses.</p>
                </div>
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={simRunning || !targetGoal.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 glow-cyan disabled:opacity-50"
            >
              {simRunning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Simulating Battle Arena...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Launch Autonomous Simulation</span>
                </>
              )}
            </button>
          </div>

          {/* Simulation Output Area */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-[#05070e] border border-terminal-border rounded-xl p-5 flex-1 min-h-[50vh] flex flex-col font-mono text-xs shadow-inner">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-terminal-border/50 flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-cyan-500" />
                Autonomous Battle Logs
              </h3>

              {currentRoundIndex >= 0 && simResults ? (
                <div className="space-y-5 flex-1 overflow-y-auto max-h-[50vh] pr-1">
                  {simResults.logs.slice(0, currentRoundIndex + 1).map((log, index) => (
                    <div key={index} className="border border-terminal-border/60 rounded-lg overflow-hidden bg-[#0a0f1d]/50">
                      {/* Round Header */}
                      <div className="bg-[#0d1222] px-4 py-2 flex justify-between items-center border-b border-terminal-border/40 text-[10px]">
                        <span className="font-bold text-cyan-400 uppercase">Round {log.round}: {log.tactic_name}</span>
                        <span className="text-slate-500">{log.tactic_desc}</span>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {/* Prompt Attack */}
                        <div className="flex gap-2">
                          <span className="text-red-500 font-bold uppercase tracking-wider text-[9px] shrink-0 mt-0.5">ATTACK:</span>
                          <p className="text-slate-300 break-all bg-red-950/10 p-2 rounded border border-red-500/10 w-full">{log.payload}</p>
                        </div>
                        
                        {/* Defense Result */}
                        <div className="flex gap-2 border-t border-terminal-border/20 pt-2.5">
                          <span className="text-cyan-400 font-bold uppercase tracking-wider text-[9px] shrink-0 mt-0.5">DEFENSE:</span>
                          <div className="space-y-1.5 w-full">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">Risk Score: <b className={log.risk_score >= 60 ? 'text-red-500' : 'text-emerald-400'}>{log.risk_score}/100</b></span>
                              <span className="text-slate-400">Decision: 
                                <b className={`ml-1 uppercase ${log.action === 'REJECT' ? 'text-red-500' : log.action === 'REWRITE' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {log.action}
                                </b>
                              </span>
                            </div>
                            
                            {log.matched_pattern && (
                              <p className="text-slate-500 text-[10px]">Matched: <code className="text-red-400/80 bg-slate-950 px-1 py-0.5 rounded">{log.matched_pattern}</code></p>
                            )}

                            {log.bypass_success ? (
                              <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-2.5 rounded flex items-center gap-2 mt-1">
                                <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
                                <span className="font-bold text-[10px]">FIREWALL BYPASSED! Blue team breached.</span>
                              </div>
                            ) : (
                              <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-2 rounded flex items-center gap-2 mt-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px]">Secure block confirmed. Attack neutralized.</span>
                              </div>
                            )}

                            {log.healing_suggestion && !appliedPatches.includes(log.healing_suggestion.name) && (
                              <div className="bg-cyan-950/20 border border-cyan-500/20 p-2.5 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                                <div>
                                  <span className="text-[9px] font-bold text-cyan-400 uppercase flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-cyan-400" />
                                    Self-Healing rule generated
                                  </span>
                                  <p className="text-slate-400 text-[10px] mt-0.5">Regex proposal: <code className="text-slate-200">{log.healing_suggestion.pattern}</code></p>
                                </div>
                                <button
                                  onClick={() => handleApplyPatch(log.healing_suggestion)}
                                  disabled={applyingPatchId === log.healing_suggestion.name}
                                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-2.5 py-1 rounded text-[9px] uppercase tracking-wider shrink-0"
                                >
                                  {applyingPatchId === log.healing_suggestion.name ? "Healing..." : "Patch Firewall"}
                                </button>
                              </div>
                            )}
                            
                            {log.healing_suggestion && appliedPatches.includes(log.healing_suggestion.name) && (
                              <div className="bg-[#0b1b16] border border-emerald-500/30 text-emerald-400 p-2 rounded flex items-center gap-1.5 mt-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] font-bold">Rule successfully patched and active!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {simRunning && currentRoundIndex < simResults.logs.length - 1 && (
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] pl-3 py-2">
                      <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                      <span>Blue Team evaluating next mutated attack vector...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Activity className="w-10 h-10 text-slate-700 animate-pulse" />
                  <p className="text-center text-[11px]">Click 'Launch Simulation' to initiate autonomous adversarial red-teaming.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stego Scanner View */}
      {activeTab === "stego" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Picker Pane */}
          <div className="lg:col-span-5 bg-terminal-card border border-terminal-border rounded-xl p-5 flex flex-col justify-between space-y-5">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-terminal-border/50 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                Select File Payload
              </h2>
              
              <div className="space-y-3 mt-4">
                {MOCK_FILES.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedFile(file); setStegoResults(null); }}
                    className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all ${selectedFile.name === file.name ? 'bg-[#15203a] border-cyan-500/40 text-slate-200' : 'bg-[#0a0f1d] border-terminal-border/60 hover:border-terminal-border text-slate-400'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        {file.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 bg-[#0e1424] px-1.5 py-0.5 rounded">{file.size}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{file.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => scanFile(selectedFile.name, selectedFile.type)}
              disabled={stegoScanning}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 glow-cyan"
            >
              {stegoScanning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Decoding Container Bits...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Run Multimodal Stego Scan</span>
                </>
              )}
            </button>
          </div>

          {/* Stego Telemetry Logs */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-[#05070e] border border-terminal-border rounded-xl p-5 flex-1 min-h-[50vh] flex flex-col font-mono text-xs shadow-inner">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-terminal-border/50 flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-cyan-500" />
                Container Extraction Console
              </h3>

              {stegoScanning ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[11px] animate-pulse">Running LSB matrix decryption & metadata parsing...</p>
                </div>
              ) : stegoResults ? (
                <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1">
                  {/* Inspection Traces */}
                  <div className="bg-[#0a0f1d] border border-terminal-border/60 p-4 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-terminal-border/30 pb-1.5">Extraction Pipeline Logs</span>
                    {stegoResults.scan_logs.map((log, idx) => (
                      <p key={idx} className={`text-[11px] leading-normal ${log.includes("ALERT") ? 'text-red-400 font-bold' : log.includes("Firewall") ? 'text-cyan-400' : 'text-slate-400'}`}>
                        {log.includes("ALERT") || log.includes("Firewall") ? "» " : "› "} {log}
                      </p>
                    ))}
                  </div>

                  {/* Extracted payload text */}
                  {stegoResults.extracted_text && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Extracted Unsafe Prompt Payload</span>
                      <div className="bg-red-950/15 border border-red-500/20 text-red-400 p-3 rounded font-mono text-[11px] break-all leading-normal">
                        {stegoResults.extracted_text}
                      </div>
                    </div>
                  )}

                  {/* Firewall safety verdict */}
                  {stegoResults.firewall_result ? (
                    <div className={`p-4 rounded-lg border flex items-start gap-3 ${stegoResults.threat_detected ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'}`}>
                      {stegoResults.threat_detected ? (
                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                      )}
                      <div className="space-y-1">
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                          Verdict: {stegoResults.threat_detected ? "Threat Quarantined" : "Clear & Safe"}
                        </span>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          The prompt firewall scan returned a risk index of **{stegoResults.firewall_result.score}/100** and successfully executed action directive **{stegoResults.firewall_result.action}**.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/10 border border-emerald-500/10 text-emerald-400 p-4 rounded-lg flex items-center gap-2 text-[11px]">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>File matches clean security metrics. Forwarded to LLM safely.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <FileCode className="w-10 h-10 text-slate-700 animate-pulse" />
                  <p className="text-center text-[11px]">Select a container payload and trigger a steganographic safety scan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Self-Healing policy list */}
      {activeTab === "healing" && (
        <div className="bg-terminal-card border border-terminal-border rounded-xl p-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-terminal-border/50 flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            Firewall Self-Healing Compiler
          </h2>

          <div className="space-y-4">
            {getSimPatches().length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <AlertCircle className="w-8 h-8 text-slate-700" />
                <p>No compiled policy suggestions. Trigger an autonomous red-team simulation to identify safety gaps.</p>
              </div>
            ) : (
              <div className="divide-y divide-terminal-border/40">
                {getSimPatches().map((patch, idx) => {
                  const isApplied = appliedPatches.includes(patch.name);
                  return (
                    <div key={idx} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-slate-200">{patch.name}</span>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">{patch.threat_type}</span>
                        </div>
                        <p className="text-slate-400 font-mono text-[11px] mt-1.5">Proposed Filter Pattern: <code className="text-red-400 bg-slate-950 px-1.5 py-0.5 rounded border border-terminal-border/40">{patch.pattern}</code></p>
                        <p className="text-slate-500 text-[10px] mt-1">{patch.reason}</p>
                      </div>

                      <button
                        onClick={() => handleApplyPatch(patch)}
                        disabled={isApplied || applyingPatchId === patch.name}
                        className={`font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-all shrink-0 ${isApplied ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400' : 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold'}`}
                      >
                        {isApplied ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Applied
                          </span>
                        ) : applyingPatchId === patch.name ? (
                          "Installing..."
                        ) : (
                          "Apply Patch"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
