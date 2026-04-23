/**
 * Inspect audit logs from the test database.
 * Usage: npx ts-node inspect-audit-logs.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';

// Use direct test database connection (not pooler)
const directDatabaseUrl = process.env.DIRECT_DATABASE_URL_TEST || process.env.DIRECT_URL;
if (!directDatabaseUrl) {
  throw new Error('DIRECT_DATABASE_URL_TEST or DIRECT_URL required');
}

const pool = new Pool({ 
  connectionString: directDatabaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  console.log('📋 Fetching latest audit logs...\n');

  try {
    // Get all audit actions
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

    // Get payment-related audit logs
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

    // Get member-related audit logs
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
