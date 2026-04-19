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
import { normalizeDatabaseUrl } from "../config/env";

// Extend globalThis to include prisma for development hot-reload handling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

/**
 * Creates a Prisma client wired to PostgreSQL through Prisma's adapter API.
 *
 * @returns A configured PrismaClient instance.
 * @throws {Error} When DATABASE_URL is missing or cannot be normalized.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({ connectionString });
  globalForPrisma.prismaPool = pool;
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

/**
 * Closes Prisma and pooled PostgreSQL connections during graceful shutdown.
 *
 * @returns A promise that resolves after all active connections are closed.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();

  if (globalForPrisma.prismaPool) {
    await globalForPrisma.prismaPool.end();
    globalForPrisma.prismaPool = undefined;
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = undefined;
  }
}

export default prisma;
