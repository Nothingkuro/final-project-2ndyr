/**
 * Prisma Client Singleton
 *
 * This module exports a singleton instance of PrismaClient using the Prisma 7.x
 * adapter pattern. It prevents multiple instances during hot-reloads in development.
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Extend globalThis to include prisma for development hot-reload handling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Creates a PrismaClient instance with the PostgreSQL adapter
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });
}

/**
 * Singleton PrismaClient instance
 *
 * In production: Creates a new PrismaClient instance
 * In development: Reuses the existing instance stored in globalThis
 * to prevent exhausting database connections during hot-reloads
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Store the instance in globalThis for development hot-reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
