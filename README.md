# Filecoin Pay Volume indexer

WIP

## FIP-0118 adherence tests

The e2e suite applies the real Prisma migrations to an explicitly named PostgreSQL test database, runs a real Nest application with mocked RPC clients, and verifies indexed events, materialized pricing periods, and volume calculation through HTTP endpoints.

```sh
npm run test:e2e
```

The connection string is read from `.env.test` as `DATABASE_URL`, and must point to the database named exactly `test`. The separate env file keeps it isolated from the development `.env`. The suite truncates its tables before running and must never be pointed at a development or production database.
