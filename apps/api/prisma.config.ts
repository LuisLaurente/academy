import { defineConfig } from 'prisma/config';

const localDatabaseUrl =
  'postgresql://postgres:postgrespassword@localhost:5433/learning_os?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
});
