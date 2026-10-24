import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import {
  Database,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Terminal,
  X,
  CheckCircle2,
  HelpCircle,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";

interface DiagnosticResult {
  success: boolean;
  latencyMs: number;
  message?: string;
  error?: string;
  name?: string;
  code?: string | number;
  tip?: string;
  details?: {
    engine: string;
    provider: string;
    ping: string;
  };
  rawErrorLog?: any;
}

export default function SystemStatusWidget() {
  const { user, isDbConnected, setIsDbConnected } = useStore();
  const [latency, setLatency] = useState<number | null>(null);
  const [readyState, setReadyState] = useState<number>(0);
  const [polling, setPolling] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [testResult, setTestResult] = useState<DiagnosticResult | null>(null);

  const fetchStatus = async (silent = true) => {
    if (!user) return;
    if (!silent) setPolling(true);
    
    try {
      const res = await fetch("/api/admin/db-diagnostics", {
        headers: {
          "X-User-Id": user.id || "",
        },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data) {
          setLatency(data.latencyMs);
          setReadyState(data.readyState);
          
          const connected = data.readyState === 1;
          if (isDbConnected !== connected) {
            setIsDbConnected(connected);
          }
        }
      }
    } catch (err) {
      console.error("Failed to poll DB status:", err);
    } finally {
      setPolling(false);
    }
  };

  useEffect(() => {
    fetchStatus(true);
    const interval = setInterval(() => fetchStatus(true), 15000);
    return () => clearInterval(interval);
  }, [user]);

  const runLiveDiagnosticTest = async () => {
    if (!user) return;
    setTesting(true);
    const loadingToast = toast.loading("Running PostgreSQL query ping test...");

    try {
      const res = await fetch("/api/admin/db-test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id || "",
        },
      });

      const data: DiagnosticResult = await res.json().catch(() => ({
        success: false,
        message: `Diagnostic test server error (${res.status})`,
        error: `HTTP ${res.status}`,
        timestamp: new Date().toISOString()
      } as unknown as DiagnosticResult));
      setTestResult(data);
      setShowModal(true);

      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success("PostgreSQL connection test passed! Database is operational.");
        fetchStatus(false);
      } else {
        toast.error("PostgreSQL connection test failed! See diagnostic logs.");
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error("Failed to execute connection test.");
      setTestResult({
        success: false,
        latencyMs: -1,
        error: err.message || "Unknown error",
        tip: "Connection attempt failed. Check process environment variables for DATABASE_URL.",
      });
      setShowModal(true);
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Logs copied to clipboard!");
  };

  const getStatusColor = () => {
    if (readyState === 1) {
      return "bg-emerald-500 shadow-emerald-500/20";
    }
    if (readyState === 2) return "bg-blue-500 shadow-blue-500/20";
    return "bg-rose-500 shadow-rose-500/20";
  };

  const getStatusText = () => {
    if (readyState === 1) return "POSTGRES ONLINE";
    if (readyState === 2) return "CONNECTING";
    return "OFFLINE";
  };

  return (
    <>
      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-3 px-4 shadow-xl select-none">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">PostgreSQL</span>
          <div className="flex items-center gap-2">
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusColor()}`}></span>
            </span>
            <span className="text-xs font-black text-white tracking-wider font-mono">
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Latency</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
            <Activity className={`w-3.5 h-3.5 ${readyState === 1 ? "text-emerald-400" : "text-zinc-500"}`} />
            <span>
              {readyState === 1 && latency !== null && latency >= 0 ? `${latency}ms` : "N/A"}
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex items-center gap-2">
          <button
            onClick={runLiveDiagnosticTest}
            disabled={testing}
            title="Perform live database ping test"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${testing ? "animate-spin" : ""}`} />
            <span>Test Connection</span>
          </button>
          
          <button
            onClick={() => {
              if (testResult) {
                setShowModal(true);
              } else {
                runLiveDiagnosticTest();
              }
            }}
            title="Troubleshoot connection issues"
            className="p-1.5 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-[#5C24FF]" />
                <div>
                  <h3 className="text-sm font-bold text-white">PostgreSQL Connection Diagnostics</h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Prisma query health check</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {testResult ? (
                <>
                  <div className={`p-4 rounded-xl border flex gap-3.5 items-start ${
                    testResult.success 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        {testResult.success ? "PostgreSQL Check Passed!" : "PostgreSQL Check Failed!"}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {testResult.message || testResult.error}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Ping Latency</span>
                      <p className="text-lg font-black text-white font-mono">
                        {testResult.latencyMs >= 0 ? `${testResult.latencyMs} ms` : "N/A"}
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Test Result</span>
                      <p className={`text-lg font-black font-mono ${testResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                        {testResult.success ? "SUCCESS" : "ERROR"}
                      </p>
                    </div>
                  </div>

                  {testResult.tip && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider">Troubleshooting Advice</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {testResult.tip}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 font-mono">Diagnostic Logs:</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(testResult, null, 2))}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Logs
                      </button>
                    </div>
                    <pre className="p-4 bg-black border border-white/5 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto max-h-48 leading-relaxed">
                      {JSON.stringify(testResult.rawErrorLog || testResult.details || testResult, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mx-auto" />
                  <p className="text-sm text-zinc-400">No test data available. Perform a connection check to analyze.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white text-black font-semibold text-sm rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
