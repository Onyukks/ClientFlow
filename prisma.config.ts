import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config();

const databaseUrl = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set before running Prisma commands.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
