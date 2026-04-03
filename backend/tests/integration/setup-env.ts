import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// In CI, DATABASE_URL_TEST is injected by workflow secrets. Keep that source of truth.
if (!process.env.CI) {
  const envTestPath = path.resolve(process.cwd(), '.env.test');

  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath, override: true });
  }
}

// Ensure runtime clients that still read DATABASE_URL continue to work.
if (!process.env.DATABASE_URL && process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
