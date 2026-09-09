import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test', override: true });

const testDatabaseUrl = process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'DATABASE_URL is required in .env.test. Refusing to run integration tests without an explicit test database.',
  );
}

const databaseName = decodeURIComponent(
  new URL(testDatabaseUrl).pathname.replace(/^\/+/, ''),
);

if (databaseName !== 'test') {
  throw new Error(
    `DATABASE_URL from .env.test must point to the database named "test"; received "${databaseName}"`,
  );
}
