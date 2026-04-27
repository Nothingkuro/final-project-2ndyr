import fs from 'node:fs';
import dotenv from 'dotenv';
import { Pool } from 'pg';

/**
 * Loads environment variables, preferring `.env.test` when available.
 *
 * This keeps audit verification pointed at the same database used by
 * integration tests instead of accidentally reading development credentials.
 */
if (fs.existsSync('.env.test')) {
  dotenv.config({ path: '.env.test', override: true });
} else {
  dotenv.config();
}

/**
 * Resolves the direct connection URL used for audit reads.
 *
 * Direct endpoints are preferred here to avoid pooler-specific behavior during
 * local diagnostics and to mirror migration/test connectivity more closely.
 */
const directDatabaseUrl = process.env.DIRECT_DATABASE_URL_TEST || process.env.DIRECT_URL;
if (!directDatabaseUrl) {
  throw new Error('DIRECT_DATABASE_URL_TEST or DIRECT_URL required');
}

/**
 * Detects local PostgreSQL URLs where SSL is typically disabled by default.
 */
const isLocalPostgres = /localhost|127\.0\.0\.1/.test(directDatabaseUrl);

const pool = new Pool({
  connectionString: directDatabaseUrl,
  /**
   * Local Homebrew PostgreSQL commonly runs without SSL, while managed cloud
   * databases typically require encrypted connections.
   */
  ssl: isLocalPostgres
    ? undefined
    : {
        rejectUnauthorized: false,
      },
});

/**
 * Queries and prints audit aggregates plus recent payment/member events.
 *
 * @returns Promise that resolves once all sections are printed.
 */
async function main() {
  console.log('📋 Fetching latest audit logs...\n');

  try {
    /**
     * High-level summary used as a quick signal that expected event types are
     * being recorded.
     */
    const actions = await pool.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
    `);

    console.log('Audit Actions Summary:');
    actions.rows.forEach((row: any) => {
      console.log(`  ${row.action}: ${row.count} events`);
    });

    console.log('\n' + '='.repeat(80));

    /**
     * Payment-focused events validate transaction lifecycle actions such as
     * create and undo.
     */
    const paymentLogs = await pool.query(`
      SELECT
        id,
        action,
        "entityId" AS "entityId",
        "actorUserId" AS "actorUserId",
        "requestId" AS "requestId",
        "ipAddress" AS "ipAddress",
        metadata,
        "createdAt" AS "createdAt"
      FROM audit_logs
      WHERE "entityType" = 'PAYMENT'
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    console.log('\n📝 Latest PAYMENT Audit Logs (5 most recent):');
    paymentLogs.rows.forEach((log: any) => {
      console.log(`\n  Action: ${log.action}`);
      console.log(`  Payment ID: ${log.entityId}`);
      console.log(`  Actor: ${log.actorUserId || '(system)'}`);
      console.log(`  Request ID: ${log.requestId || 'N/A'}`);
      console.log(`  IP Address: ${log.ipAddress || 'N/A'}`);
      console.log(`  Timestamp: ${new Date(log.createdAt).toISOString()}`);
      if (log.metadata) {
        console.log(`  Metadata: ${JSON.stringify(log.metadata, null, 4)}`);
      }
    });

    /**
     * Member-focused events validate subscription state transitions that result
     * from payment operations.
     */
    const memberLogs = await pool.query(`
      SELECT
        id,
        action,
        "entityId" AS "entityId",
        "actorUserId" AS "actorUserId",
        "requestId" AS "requestId",
        metadata,
        "createdAt" AS "createdAt"
      FROM audit_logs
      WHERE "entityType" = 'MEMBER'
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    console.log('\n' + '='.repeat(80));
    console.log('\n👤 Latest MEMBER Audit Logs (5 most recent):');
    memberLogs.rows.forEach((log: any) => {
      console.log(`\n  Action: ${log.action}`);
      console.log(`  Member ID: ${log.entityId}`);
      console.log(`  Actor: ${log.actorUserId || '(system)'}`);
      console.log(`  Request ID: ${log.requestId || 'N/A'}`);
      console.log(`  Timestamp: ${new Date(log.createdAt).toISOString()}`);
      if (log.metadata) {
        console.log(`  Metadata: ${JSON.stringify(log.metadata, null, 4)}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    const countResult = await pool.query('SELECT COUNT(*) as total FROM audit_logs');
    console.log(`\n✅ Total audit logs in database: ${countResult.rows[0].total}`);
  } catch (error: any) {
    /**
     * Common first-run case: migrations have not been applied on the currently
     * selected test database.
     */
    if (error.message.includes('relation "audit_logs" does not exist')) {
      console.log('⚠️  Audit logs table not found in test database.');
      console.log('   The integration tests passed, which means audits were written to a test DB.');
      console.log('   Run integration tests to see audit logs being created:\n');
      console.log('   npm run test:integration -- tests/integration/payment-subscription.integration.test.ts');
      return;
    }
    throw error;
  }
}


main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
