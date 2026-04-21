import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import prisma, { disconnectPrisma } from '../../src/lib/prisma';
import { seedE2EDatabase } from './seed-e2e';

const LOCK_DIR = path.join(os.tmpdir(), 'arrowhead-e2e-db-reset.lock');
const LOCK_MAX_AGE_MS = 5 * 60 * 1000;
const LOCK_WAIT_TIMEOUT_MS = 60 * 1000;
const LOCK_POLL_INTERVAL_MS = 200;

function quoteIdentifier(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}

function assertSafeDatabaseUrl(): void {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error('DATABASE_URL is required for E2E DB reset.');
	}

	// Prevent accidental truncation of a non-test database.
	const isLikelyTestDatabase = /test/i.test(databaseUrl);
	if (!isLikelyTestDatabase && process.env.E2E_ALLOW_NON_TEST_DB_RESET !== 'true') {
		throw new Error(
			'Refusing to reset DATABASE_URL because it does not look like a test database. ' +
				'Include "test" in the URL or set E2E_ALLOW_NON_TEST_DB_RESET=true to override.',
		);
	}
}

async function truncatePublicTables(): Promise<void> {
	const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
		SELECT tablename
		FROM pg_tables
		WHERE schemaname = 'public'
			AND tablename <> '_prisma_migrations'
	`;

	if (tables.length === 0) {
		return;
	}

	const qualifiedTables = tables
		.map(({ tablename }) => `"public".${quoteIdentifier(tablename)}`)
		.join(', ');

	await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${qualifiedTables} RESTART IDENTITY CASCADE`);
}

async function ensurePaymentColumns(): Promise<void> {
	await prisma.$executeRawUnsafe(
		'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT',
	);
	await prisma.$executeRawUnsafe(
		'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "previousStatus" TEXT',
	);
	await prisma.$executeRawUnsafe(
		'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "previousExpiryDate" TIMESTAMP(3)',
	);
}

async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireResetLock(): Promise<() => Promise<void>> {
	const start = Date.now();

	while (true) {
		try {
			await fs.mkdir(LOCK_DIR);
			return async () => {
				await fs.rm(LOCK_DIR, { recursive: true, force: true });
			};
		} catch (error) {
			const nodeError = error as NodeJS.ErrnoException;

			if (nodeError.code !== 'EEXIST') {
				throw error;
			}

			try {
				const stats = await fs.stat(LOCK_DIR);
				if (Date.now() - stats.mtimeMs > LOCK_MAX_AGE_MS) {
					await fs.rm(LOCK_DIR, { recursive: true, force: true });
					continue;
				}
			} catch {
				// Lock disappeared between checks; retry immediately.
				continue;
			}

			if (Date.now() - start > LOCK_WAIT_TIMEOUT_MS) {
				throw new Error('Timed out waiting for E2E DB reset lock');
			}

			await sleep(LOCK_POLL_INTERVAL_MS);
		}
	}
}

async function main(): Promise<void> {
	const releaseLock = await acquireResetLock();

	try {
		assertSafeDatabaseUrl();
		await ensurePaymentColumns();
		await truncatePublicTables();
		await seedE2EDatabase();
	} finally {
		await releaseLock();
	}
}

main()
	.catch(async (error) => {
		console.error('E2E DB reset failed:', error);

		try {
			await disconnectPrisma();
		} catch {
			// Best effort disconnect
		}

		process.exit(1);
	});
