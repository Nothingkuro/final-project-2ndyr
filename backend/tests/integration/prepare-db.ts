import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

if (process.env.CI) {
  process.exit(0);
}

const envTestPath = path.resolve(process.cwd(), '.env.test');

if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath, override: true });
}

if (!process.env.DATABASE_URL_TEST && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_TEST (or DATABASE_URL) is required to run integration tests.');
}

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
execSync('npx prisma migrate dev', { stdio: 'inherit', env: process.env });
