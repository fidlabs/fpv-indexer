# Filecoin Pay Volume indexer

WIP

# RESTful API

Filecoin Pay Volume indexer instance exposes a RESTful API to query Service Orchestrators' quarterly volume calculated according to FIP-0118, along with additional endpoints for checking service health and in general improving auditability and visibility. OpenAPI documentation of available endpoints and returned data types is available on root route (`/`) of running indexer instance.

## FIP-0118 adherence tests

The e2e suite applies the real Prisma migrations to an explicitly named PostgreSQL test database, runs a real Nest application with mocked RPC clients, and verifies indexed events, materialized pricing periods, and volume calculation through HTTP endpoints.

```sh
npm run test:e2e
```

The suite truncates its tables before running and must never be pointed at a development or production database.
