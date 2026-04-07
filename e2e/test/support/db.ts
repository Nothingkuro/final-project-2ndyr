import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../../..');
const backendRoot = path.join(repoRoot, 'backend');
const DB_RESET_TIMEOUT_MS = Number(process.env.E2E_DB_RESET_TIMEOUT_MS ?? '180000');

export function resetDatabase(trigger: string): void {
  const resolvedDatabaseUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;

  if (!resolvedDatabaseUrl) {
    throw new Error(
      'Missing DATABASE_URL_TEST for E2E DB reset. Set DATABASE_URL_TEST in e2e/.env.test.',
    );
  }

  process.env.DATABASE_URL = resolvedDatabaseUrl;

  const startedAt = Date.now();
  process.stdout.write(`[playwright-db] reset start (${trigger})\n`);

  try {
    const tsNodeBinPath = path.join(backendRoot, 'node_modules', 'ts-node', 'dist', 'bin.js');
    const resetScriptPath = path.join(backendRoot, 'tests', 'e2e', 'reset-db.ts');

    if (fs.existsSync(tsNodeBinPath)) {
      execFileSync(process.execPath, [tsNodeBinPath, resetScriptPath], {
        cwd: backendRoot,
        stdio: 'inherit',
        timeout: DB_RESET_TIMEOUT_MS,
      });
    } else {
      // Fallback for unexpected environments where backend deps are not installed yet.
      execSync('npm --prefix backend run db:reset:e2e', {
        cwd: repoRoot,
        stdio: 'inherit',
        timeout: DB_RESET_TIMEOUT_MS,
      });
    }
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    process.stderr.write(`[playwright-db] reset failed in ${elapsedMs}ms (${trigger})\n`);
    throw error;
  }

  const elapsedMs = Date.now() - startedAt;
  process.stdout.write(`[playwright-db] reset complete in ${elapsedMs}ms (${trigger})\n`);
}
