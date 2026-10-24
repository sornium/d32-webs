import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) {
    // Return standard client if no DATABASE_URL yet
    return new PrismaClient();
  }
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  if (!url) return false;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed.includes('<') ||
    trimmed.includes('YOUR_DATABASE_URL') ||
    (!trimmed.startsWith('postgresql://') && !trimmed.startsWith('postgres://'))
  ) {
    return false;
  }
  return true;
}

export async function checkDatabaseHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  latencyMs: number;
  error?: string;
}> {
  const configured = isDatabaseConfigured();
  console.log('[checkDatabaseHealth] configured:', configured, 'DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');
  if (!configured) {
    return {
      configured: false,
      connected: false,
      latencyMs: -1,
      error: 'DATABASE_URL environment variable is not configured or is invalid.',
    };
  }

  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      configured: true,
      connected: true,
      latencyMs,
    };
  } catch (err: any) {
    console.error('[checkDatabaseHealth] error:', err);
    return {
      configured: true,
      connected: false,
      latencyMs: -1,
      error: err.message || 'Failed to connect to PostgreSQL / Neon database.',
    };
  }
}
