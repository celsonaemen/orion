import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  return databaseUrl;
}

export function createPrismaAdapter() {
  return new PrismaPg({ connectionString: getDatabaseUrl() });
}

export function createPrismaClient(options: Prisma.PrismaClientOptions = {}) {
  return new PrismaClient({
    ...options,
    adapter: createPrismaAdapter(),
  });
}
