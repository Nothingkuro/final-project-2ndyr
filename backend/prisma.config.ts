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

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  datasource: {
    url: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL,
  },
});
