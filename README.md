# Filecoin Pay Volume indexer

WIP

## FIP-0118 adherence tests

The e2e suite applies the real Prisma migrations to an explicitly named PostgreSQL test database, runs a real Nest application with mocked RPC clients, and verifies indexed events, materialized pricing periods, and volume calculation through HTTP endpoints.

```sh
npm run test:e2e
```

The suite truncates its tables before running and must never be pointed at a development or production database.
