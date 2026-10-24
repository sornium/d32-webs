// Client-side Prisma utility helper & configuration status
export interface DatabaseDiagnostics {
  configured: boolean;
  connected: boolean;
  latencyMs: number;
  engine: "Prisma (PostgreSQL/Neon)";
  error?: string;
  details?: Record<string, any>;
}
