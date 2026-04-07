import path from 'node:path';
import dotenv from 'dotenv';

const e2eEnvPath = path.resolve(__dirname, '../../.env');
const repoEnvPath = path.resolve(__dirname, '../../../.env');
const backendEnvPath = path.resolve(__dirname, '../../../backend/.env');

dotenv.config({ path: repoEnvPath, override: false });
dotenv.config({ path: backendEnvPath, override: false });
dotenv.config({ path: e2eEnvPath, override: true });

export const FRONTEND_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
export const LOGIN_USERNAME = process.env.E2E_LOGIN_USERNAME ?? process.env.SEED_STAFF_USERNAME ?? 'staff';
export const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? process.env.SEED_STAFF_PASSWORD;
