import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  Database,
  Cpu,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Zap,
  Play,
  Pause,
  Sliders,
  ServerCrash,
} from "lucide-react";
import toast from "react-hot-toast";

interface LatencyDataPoint {
  time: string;
  latency: number;
  readOps: number;
  writeOps: number;
}

interface QueryLog {
  id: string;
  timestamp: string;
  type: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "PING";
  query: string;
  latency: number;
  status: "success" | "warning" | "error";
}

export default function DashboardMonitoring() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [simulationMode, setSimulationMode] = useState<"optimal" | "high-load" | "unstable" | "disconnected">("optimal");
  const [latencyData, setLatencyData] = useState<LatencyDataPoint[]>([]);
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([]);
  const [metrics, setMetrics] = useState({
    avgLatency: 12,
    cpuUsage: 14,
    memoryUsage: 42,
    activeConnections: 3,
    totalQueries: 1420,
    writeRate: 2.1,
    readRate: 15.4,
  });

  const counterRef = useRef(1420);

  // Initialize data
  useEffect(() => {
    const initialData: LatencyDataPoint[] = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 3000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      initialData.push({
        time: timeStr,
        latency: Math.floor(Math.random() * 8) + 8,
        readOps: Math.floor(Math.random() * 10) + 12,
        writeOps: Math.floor(Math.random() * 3) + 1,
      });
    }
    setLatencyData(initialData);

    const initialLogs: QueryLog[] = [
      {
        id: "1",
        timestamp: new Date(now.getTime() - 4000).toLocaleTimeString(),
        type: "SELECT",
        query: "User.findOne({ email: 'john@example.com' })",
        latency: 12,
        status: "success",
      },
      {
        id: "2",
        timestamp: new Date(now.getTime() - 3000).toLocaleTimeString(),
        type: "INSERT",
        query: "Order.create({ userId: 'u_81723', total: 49.99 })",
        latency: 45,
        status: "success",
      },
      {
        id: "3",
        timestamp: new Date(now.getTime() - 1000).toLocaleTimeString(),
        type: "PING",
        query: "admin().ping()",
        latency: 9,
        status: "success",
      },
    ];
    setQueryLogs(initialLogs);
  }, []);

  // Real-time generator loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // 1. Determine latency and parameters based on simulation mode
      let baseLatency = 10;
      let noise = 5;
      let cpuBase = 12;
      let activeConn = 3;
      let errorChance = 0.02;

      if (simulationMode === "high-load") {
        baseLatency = 85;
        noise = 30;
        cpuBase = 78;
        activeConn = 24;
        errorChance = 0.08;
      } else if (simulationMode === "unstable") {
        baseLatency = 40;
        noise = 120;
        cpuBase = 35;
        activeConn = 7;
        errorChance = 0.35;
      } else if (simulationMode === "disconnected") {
        baseLatency = 0;
        noise = 0;
        cpuBase = 2;
        activeConn = 0;
        errorChance = 1.0;
      }

      const rawLatency = baseLatency > 0 ? Math.floor(baseLatency + (Math.random() - 0.5) * noise) : -1;
      const finalLatency = rawLatency < 0 && simulationMode !== "disconnected" ? 3 : rawLatency;

      const readOps = simulationMode === "disconnected" ? 0 : Math.floor(Math.random() * (simulationMode === "high-load" ? 50 : 15)) + (simulationMode === "high-load" ? 80 : 10);
      const writeOps = simulationMode === "disconnected" ? 0 : Math.floor(Math.random() * (simulationMode === "high-load" ? 15 : 4)) + (simulationMode === "high-load" ? 12 : 1);

      // Add data point
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setLatencyData((prev) => {
        const next = [...prev];
        if (next.length >= 20) {
          next.shift();
        }
        next.push({
          time: timeStr,
          latency: simulationMode === "disconnected" ? 0 : finalLatency,
          readOps,
          writeOps,
        });
        return next;
      });

      // Increment query count
      counterRef.current += (readOps + writeOps);

      // Calculate state metrics
      setMetrics((prev) => {
        const newCpu = Math.min(99, Math.max(1, Math.floor(cpuBase + (Math.random() - 0.5) * 10)));
        const newMem = Math.min(95, Math.max(10, Math.floor(prev.memoryUsage + (Math.random() - 0.5) * 2)));
        return {
          avgLatency: simulationMode === "disconnected" ? 0 : Math.max(4, Math.floor(prev.avgLatency * 0.8 + finalLatency * 0.2)),
          cpuUsage: newCpu,
          memoryUsage: newMem,
          activeConnections: activeConn,
          totalQueries: counterRef.current,
          writeRate: writeOps / 3,
          readRate: readOps / 3,
        };
      });

      // Generate a simulated query log
      const queryTypes: Array<"SELECT" | "INSERT" | "UPDATE" | "DELETE" | "PING"> = ["SELECT", "SELECT", "INSERT", "UPDATE", "PING"];
      const selectedType = queryTypes[Math.floor(Math.random() * queryTypes.length)];
      
      const queriesMap = {
        SELECT: "User.find({ role: 'customer' }).limit(20)",
        INSERT: `Order.create({ userId: 'u_${Math.floor(Math.random() * 90000 + 10000)}', total: ${Math.floor(Math.random() * 200 + 5)}.99 })`,
        UPDATE: `ProxyListing.findOneAndUpdate({ id: 'p_${Math.floor(Math.random() * 100)}' }, { status: 'Active' })`,
        DELETE: "Session.deleteMany({ expires: { $lt: new Date() } })",
        PING: "admin().ping()",
      };

      const isError = Math.random() < errorChance;
      const isWarning = !isError && finalLatency > 100;
      
      const status: "success" | "warning" | "error" = isError
        ? "error"
        : isWarning
        ? "warning"
        : "success";

      const queryLogText = isError 
        ? "MongooseError: Connection timeout. Could not establish handshake with replica set."
        : queriesMap[selectedType];

      const newLog: QueryLog = {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: selectedType,
        query: queryLogText,
        latency: isError ? -1 : finalLatency,
        status,
      };

      setQueryLogs((prev) => [newLog, ...prev].slice(0, 50));
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, simulationMode]);

  const clearLogs = () => {
    setQueryLogs([]);
    toast.success("Query logs cleared");
  };

  const getStatusConfig = () => {
    switch (simulationMode) {
      case "optimal":
        return {
          title: "Database Healthy",
          desc: "Neon PostgreSQL connection is fully optimized and responding well.",
          color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
          dotColor: "bg-emerald-500",
        };
      case "high-load":
        return {
          title: "High Traffic Load",
          desc: "Responding with slight queuing delay. Server load is elevated.",
          color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
          dotColor: "bg-amber-500",
        };
      case "unstable":
        return {
          title: "Unstable Connectivity",
          desc: "Intermittent timeouts detected. Handshake times are fluctuating.",
          color: "text-orange-400 border-orange-500/20 bg-orange-500/5",
          dotColor: "bg-orange-500",
        };
      case "disconnected":
        return {
          title: "Cluster Disconnected",
          desc: "Connection failed. Please ensure database connection string is valid.",
          color: "text-red-400 border-red-500/20 bg-red-500/5",
          dotColor: "bg-red-500",
        };
    }
  };

  const statusCfg = getStatusConfig();

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Database Metrics & Live Telemetry</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Real-time interactive monitoring console. Track querying, indexing overhead, and connection stress tests.
          </p>
        </div>

        {/* Controller */}
        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg transition-all ${
              isPlaying ? "text-purple-400 bg-purple-500/10" : "text-zinc-400 hover:text-white"
            }`}
            title={isPlaying ? "Pause Real-time Feed" : "Resume Real-time Feed"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <div className="h-4 w-[1px] bg-white/10" />

          <span className="text-xs font-semibold text-zinc-400 px-2 flex items-center gap-1.5">
            <Sliders className="w-3 h-3" /> Stress Test Mode:
          </span>

          <select
            value={simulationMode}
            onChange={(e) => setSimulationMode(e.target.value as any)}
            className="bg-transparent text-xs text-white font-bold border-none outline-none focus:ring-0 cursor-pointer pr-8"
          >
            <option value="optimal" className="bg-[#0f0f0f] text-emerald-400">Optimal (Normal)</option>
            <option value="high-load" className="bg-[#0f0f0f] text-amber-400">High Load (Stress)</option>
            <option value="unstable" className="bg-[#0f0f0f] text-orange-400">Unstable (Spikes)</option>
            <option value="disconnected" className="bg-[#0f0f0f] text-red-400">Disconnected</option>
          </select>
        </div>
      </div>

      {/* Grid: Live Status Banner & Server Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Callout */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${statusCfg.color} min-h-[160px]`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dotColor} animate-pulse`} />
              <h3 className="font-bold text-lg text-white">{statusCfg.title}</h3>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {statusCfg.desc}
            </p>
          </div>
          
          <div className="text-xs text-zinc-400 border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
            <span>Simulation Feed:</span>
            <span className="font-bold uppercase tracking-wider text-white">
              {isPlaying ? "Active (Refreshing)" : "Paused"}
            </span>
          </div>
        </div>

        {/* Core Stats Bar */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Avg Latency</span>
            <p className="text-3xl font-black text-white font-mono">
              {simulationMode === "disconnected" ? "—" : `${metrics.avgLatency}ms`}
            </p>
            <span className="text-[10px] text-zinc-500">Mongoose Ping Avg</span>
          </div>

          <div className="space-y-1">
            <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Conns</span>
            <p className="text-3xl font-black text-purple-400 font-mono">
              {metrics.activeConnections}
            </p>
            <span className="text-[10px] text-zinc-500">NodePool Size: Max 5</span>
          </div>

          <div className="space-y-1">
            <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">CPU Util</span>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-white font-mono">{metrics.cpuUsage}%</p>
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-purple-500 h-full transition-all duration-1000" 
                style={{ width: `${metrics.cpuUsage}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Memory Allocation</span>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-white font-mono">{metrics.memoryUsage}%</p>
              <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-[#5C24FF] h-full transition-all duration-1000" 
                style={{ width: `${metrics.memoryUsage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Latency Over Time Chart */}
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold text-white">Database Query Latency Benchmarks (Real-time)</h3>
          </div>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" /> Updates every 3s
          </span>
        </div>

        <div className="h-[260px] w-full">
          {simulationMode === "disconnected" ? (
            <div className="w-full h-full border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
              <ServerCrash className="w-12 h-12 text-red-500 animate-bounce" />
              <div className="space-y-1">
                <p className="font-bold text-white">Latency Graph Inactive</p>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Database cluster connection is completely offline. Latency telemetry cannot be benchmarked.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5C24FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#5C24FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#666', offset: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  labelStyle={{ color: "#aaa", fontSize: "11px" }}
                  itemStyle={{ color: "#fff", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#5C24FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                  name="Query Latency"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Query Console Terminal */}
      <div className="p-6 rounded-2xl bg-[#030303] border border-white/10 space-y-4 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Live Query & Schema Event Stream</h3>
          </div>
          <button
            onClick={clearLogs}
            className="text-[11px] text-zinc-500 hover:text-white transition-colors border border-white/5 bg-white/5 px-2.5 py-1 rounded-lg"
          >
            Clear Console
          </button>
        </div>

        <div className="bg-[#050505] p-4 rounded-xl border border-white/5 h-[280px] overflow-y-auto space-y-2 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
          {queryLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-600 italic">
              Listening for queries...
            </div>
          ) : (
            queryLogs.map((log) => {
              let tagColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              let msgColor = "text-zinc-300";
              if (log.status === "warning") {
                tagColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                msgColor = "text-amber-100/80";
              } else if (log.status === "error") {
                tagColor = "bg-red-500/10 text-red-400 border-red-500/20";
                msgColor = "text-red-300";
              }

              return (
                <div key={log.id} className="flex flex-col md:flex-row md:items-start justify-between py-1.5 border-b border-white/5 last:border-0 gap-2">
                  <div className="flex items-start gap-2 max-w-full overflow-hidden">
                    <span className="text-zinc-600 flex-shrink-0">[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold flex-shrink-0 ${tagColor}`}>
                      {log.type}
                    </span>
                    <span className={`break-all ${msgColor}`}>{log.query}</span>
                  </div>
                  {log.latency >= 0 && (
                    <span className={`text-[10px] font-bold flex-shrink-0 ${log.latency > 100 ? "text-amber-400" : "text-emerald-400"}`}>
                      {log.latency} ms
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
