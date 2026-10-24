import { prisma, isDatabaseConfigured, checkDatabaseHealth } from './lib/prisma.js';

export { prisma, isDatabaseConfigured, checkDatabaseHealth };

export function cleanUsername(input: string): string {
  // 1. Force lowercase immediately
  let u = (input || '').toLowerCase();

  // 2. Remove forbidden characters/symbols (@, #, :, `, and anything not a-z0-9._)
  u = u.replace(/[^a-z0-9._]/g, '');

  // 3. Domain endings / TLD blocklist
  const domainTLDs = ['store', 'com', 'net', 'org', 'io', 'gg', 'co', 'app', 'xyz', 'dev', 'run'];
  domainTLDs.forEach((tld) => {
    while (u.endsWith('.' + tld) || u.includes('.' + tld + '.')) {
      u = u.replace(new RegExp('\\.' + tld, 'g'), '');
    }
  });

  // 4. Reserved site routes, domain names, and policy terms blocklist
  const reservedWords = [
    'd32', 'store', 'd32store', 'discord', 'everyone', 'here',
    'payment', 'payments', 'paymentmethods', 'payment-methods',
    'terms', 'tos', 'termsofservice', 'terms-of-service',
    'guidelines', 'communityguidelines', 'community-guidelines',
    'safety', 'safetypolicies', 'safety-policies',
    'admin', 'administrator', 'support', 'ticket', 'tickets',
    'reviews', 'null', 'undefined', 'system', 'help', 'faq', 'mod', 'moderator'
  ];

  reservedWords.forEach((word) => {
    const cleanWord = word.replace(/[^a-z0-9._]/g, '');
    while (u.includes(cleanWord)) {
      u = u.replace(new RegExp(cleanWord, 'g'), '');
    }
  });

  // 5. Consecutive periods (e.g. "user..name" is forbidden)
  while (u.includes('..')) {
    u = u.replace(/\.\./g, '.');
  }

  // 6. Symbol placements: cannot start or end with . or _
  u = u.replace(/^[._]+/g, '');
  u = u.replace(/[._]+$/g, '');

  // Double check consecutive periods or start/end after replacements
  while (u.includes('..')) {
    u = u.replace(/\.\./g, '.');
  }
  u = u.replace(/^[._]+/g, '');
  u = u.replace(/[._]+$/g, '');

  // 7. Length: between 2 and 32 characters
  if (u.length > 32) {
    u = u.substring(0, 32);
    u = u.replace(/[._]+$/g, '');
  }

  // 8. If too short or completely stripped due to reserved word match, append random allowed characters/numbers
  const allowedChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  if (u.length < 2) {
    u = 'user';
    while (u.length < 6) {
      u += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }
  }

  return u;
}

export let remoteConnectionError: string | null = null;

export async function connectDB() {
  if (!isDatabaseConfigured()) {
    console.log('[Database] DATABASE_URL (PostgreSQL/Neon) is not configured or is invalid.');
    remoteConnectionError = "DATABASE_URL is not configured. Please configure your Neon/PostgreSQL database connection string.";
    return;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[Database] PostgreSQL / Neon database connected successfully via Prisma Client');
    remoteConnectionError = null;
  } catch (error: any) {
    console.error('[Database] PostgreSQL connection error via Prisma:', error);
    remoteConnectionError = error?.message || String(error);
  }
}
