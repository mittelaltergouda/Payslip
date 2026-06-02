// ============================================================================
// PRISMA CLIENT SINGLETON
// ============================================================================
// This module provides a singleton instance of PrismaClient for use across
// the application, preventing multiple instances in development.

import { PrismaClient } from "@prisma/client";

/**
 * Global reference to PrismaClient for development hot-reloading.
 * In development, Next.js hot-reload can create multiple instances of
 * PrismaClient, which triggers warnings. This global reference ensures
 * we reuse the same instance across hot-reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient instance.
 * In production, creates a new instance. In development, reuses existing
 * instance from global scope to prevent connection pool exhaustion.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Store instance globally in development to persist across hot-reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
