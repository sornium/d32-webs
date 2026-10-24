import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import {
  Server,
  Database,
  Activity,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

interface DiagnosticData {
  configured: boolean;
  maskedUri: string;
  readyState: number;
  status: string;
  latencyMs: number;
  host: string;
  error: string | null;
  remoteError?: string | null;
  timestamp: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  status: string;
  latencyMs: number;
  success: boolean;
}

export default function DbDiagnostics() {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [testingLatency, setTestingLatency] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchDiagnostics = async (showToast = false) => {
    try {
      const res = await fetch("/api/admin/db-diagnostics", {
        headers: {
          "X-User-Id": user?.id || "",
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data: DiagnosticData = await res.json();
      setDiagnostics(data);
      
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        status: data.status,
        latencyMs: data.latencyMs,
        success: data.readyState === 1 && !data.error,
      };
      setHistory((prev) => [newHistoryItem, ...prev].slice(0, 10));

      if (showToast) {
        if (data.readyState === 1 && !data.error) {
          toast.success(`PostgreSQL Check Passed! Query latency: ${data.latencyMs}ms`);
        } else {
          toast.error(`Database Alert: ${data.error || "Disconnected"}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) toast.error("Diagnostics check failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(() => fetchDiagnostics(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTestLatency = async () => {
    setTestingLatency(true);
    await fetchDiagnostics(true);
    setTestingLatency(false);
  };

  if (loading && !diagnostics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-10 h-10 border-2 border-white/10 border-t-[#5C24FF] rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-sm">Gathering PostgreSQL connection diagnostics...</p>
      </div>
    );
  }

  const isConnected = diagnostics?.readyState === 1;

  const latencyColor = (ms: number) => {
    if (ms < 0) return "text-red-500";
    if (ms < 50) return "text-emerald-400";
    if (ms < 150) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"} animate-pulse`} />
            <h2 className="text-xl font-bold text-white tracking-tight">PostgreSQL / Neon (Prisma ORM) Connection</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Real-time status of your Neon PostgreSQL database, Prisma ORM queries, and benchmark latencies.
          </p>
        </div>
        
        <button
          onClick={handleTestLatency}
          disabled={testingLatency}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#5C24FF] hover:bg-[#4A1DCC] text-white rounded-xl text-sm font-semibold transition-colors shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testingLatency ? "animate-spin" : ""}`} />
          Run Health & Latency Check
        </button>
      </div>

      {!diagnostics?.configured && (
        <div className="p-5 rounded-2xl bg-[#5C24FF]/10 border border-[#5C24FF]/20 flex gap-4">
          <AlertTriangle className="w-6 h-6 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">PostgreSQL Connection Alert</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              To connect your live PostgreSQL database, add <code className="text-white bg-white/10 px-1 rounded">DATABASE_URL</code> and <code className="text-white bg-white/10 px-1 rounded">DIRECT_URL</code> in your AI Studio environment settings.
            </p>
            {diagnostics?.remoteError && (
              <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-xl text-xs font-mono text-rose-400">
                <span className="block text-zinc-500 text-[10px] uppercase font-bold mb-1">PostgreSQL Connection Error Log:</span>
                <span>{diagnostics.remoteError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Connection State</span>
            {isConnected ? (
              <Wifi className="w-5 h-5 text-emerald-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div>
            <p className="text-3xl font-black text-white">{diagnostics?.status || "Unknown"}</p>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span>OR Engine:</span>
              <span className="font-mono text-white bg-white/10 px-1 rounded">Prisma Client v7</span>
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Query Latency</span>
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className={`text-3xl font-black ${diagnostics ? latencyColor(diagnostics.latencyMs) : "text-white"}`}>
              {diagnostics && diagnostics.latencyMs >= 0 ? `${diagnostics.latencyMs} ms` : "N/A"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Time to execute <code className="text-white font-mono bg-white/10 px-1 rounded">SELECT 1</code> query
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Database Engine</span>
            {isConnected ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div>
            <p className="text-3xl font-black text-white">Neon Postgres</p>
            <p className="text-xs text-zinc-500 mt-1">
              Parameterized Prisma queries & Pooling enabled.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-6">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-zinc-400" />
              <h3 className="text-lg font-semibold text-white">PostgreSQL Connection String</h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">DATABASE_URL</span>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#050505] border border-white/5 font-mono text-xs text-zinc-300 break-all select-all">
                  <Terminal className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span>{diagnostics?.maskedUri || "No connection string found"}</span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1.5 block">
                  Database password and credentials masked to protect sensitive secrets.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#050505] border border-white/5 space-y-1">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Active Database Host</span>
                  <span className="text-sm text-zinc-200 font-mono break-all">{diagnostics?.host || "Neon Serverless"}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#050505] border border-white/5 space-y-1">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Last Diagnostics Check</span>
                  <span className="text-sm text-zinc-200">{diagnostics ? new Date(diagnostics.timestamp).toLocaleString() : "Never"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">Recent Checks History</h3>
              </div>
              <span className="text-xs text-zinc-500">Last 10 executions</span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/5 rounded-xl">
                <p className="text-zinc-500 text-sm">No historical logs yet. Run checks above to populate.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-2.5">Time</th>
                      <th className="py-2.5">State</th>
                      <th className="py-2.5 text-right">Latency</th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((item) => (
                      <tr key={item.id} className="text-zinc-300">
                        <td className="py-3 font-mono text-xs">{item.timestamp}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                            <span className={`w-1.5 h-1.5 rounded-full ${item.success ? "bg-emerald-500" : "bg-red-500"}`} />
                            {item.status}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-mono text-xs font-bold ${latencyColor(item.latencyMs)}`}>
                          {item.latencyMs >= 0 ? `${item.latencyMs}ms` : "N/A"}
                        </td>
                        <td className="py-3 text-right">
                          {item.success ? (
                            <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2.5 py-1 rounded-lg font-medium border border-emerald-500/10">Passed</span>
                          ) : (
                            <span className="text-red-400 text-xs bg-red-500/10 px-2.5 py-1 rounded-lg font-medium border border-red-500/10">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Neon / Prisma Stack</h4>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Prisma ORM with type-safe parameterized SQL generation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Neon PostgreSQL auto-scaling connection pooling.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Unified database shared with Discord Bot and Website.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
