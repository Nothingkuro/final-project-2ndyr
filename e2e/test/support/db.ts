import { execSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../../..');

export function resetDatabase(trigger: string): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'Missing DATABASE_URL for E2E DB reset. Set DATABASE_URL to your test database before running E2E tests.',
    );
  }

  execSync('npm --prefix backend run db:reset:e2e', {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  });

  process.stdout.write(`[playwright-db] reset complete (${trigger})\\n`);
}
