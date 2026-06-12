import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export const connectPostgres = async (): Promise<PrismaClient> => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("Connecting to PostgreSQL...");
  prisma = new PrismaClient();
  await prisma.$connect();
  console.log("PostgreSQL connected");

  return prisma;
};

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    throw new Error("Prisma client is not connected. Call connectPostgres() first.");
  }

  return prisma;
};
