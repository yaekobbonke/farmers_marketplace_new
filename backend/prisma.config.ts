import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // We use a fallback string here to prevent the "startsWith" undefined error
    url: process.env.DATABASE_URL || "postgresql://Yaekob:5003@localhost:5432/marketplace",
  },
});