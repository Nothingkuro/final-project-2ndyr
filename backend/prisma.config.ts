/**
 * Prisma Configuration for Migrations
 *
 * This file configures database connection for Prisma Migrate and other CLI tools.
 * Required for Prisma 7.x which separates runtime configuration from schema.
 *
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */

import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env file before accessing environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

const DATABASE_URL_PREFIX = "DATABASE_URL=";

function normalizeDatabaseUrl(rawValue: string | undefined | null): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  let normalizedValue = rawValue.trim();

  if (normalizedValue.startsWith(DATABASE_URL_PREFIX)) {
    normalizedValue = normalizedValue.slice(DATABASE_URL_PREFIX.length).trim();
  }

  const isWrappedInQuotes =
    (normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) ||
    (normalizedValue.startsWith("'") && normalizedValue.endsWith("'"));

  if (isWrappedInQuotes) {
    normalizedValue = normalizedValue.slice(1, -1).trim();
  }

  return normalizedValue || undefined;
}


const pooledUrl = normalizeDatabaseUrl(process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL);
const directMigrationUrl = normalizeDatabaseUrl(
  process.env.DIRECT_DATABASE_URL_TEST ?? process.env.DIRECT_URL_TEST ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL,
);
const isMigrateCommand = process.argv.some((arg) => arg === "migrate" || arg.includes("prisma/migrate"));
const datasourceUrl = isMigrateCommand ? directMigrationUrl ?? pooledUrl : pooledUrl ?? directMigrationUrl;

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  datasource: {
    // Prisma 7.6 config supports a single datasource URL.
    // Use Neon direct URL for migrate commands and pooled URL otherwise.
    url: datasourceUrl,
  },
});
