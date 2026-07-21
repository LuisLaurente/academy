import { defineConfig } from 'prisma/config';

const localDatabaseUrl =
  'postgresql://learning_os:learning_os_dev@localhost:5432/learning_os?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
});
