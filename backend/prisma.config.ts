import 'dotenv/config';
import { defineConfig } from 'prisma/config';

declare const process: { env: { DATABASE_URL?: string } };

export default defineConfig({
  schema: 'prisma/schema.prisma',

  datasource: {
    url: process.env.DATABASE_URL!,
  },

  migrations: {
    seed: 'ts-node --project tsconfig.json ./prisma/seed.ts',
    // seed: 'bun backend/prisma/seed.ts',
  },
});