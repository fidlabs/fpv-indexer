import { Kysely, PostgresDialect, Transaction } from 'kysely';
import { Pool } from 'pg';
import type { DB } from './types';

export type TransactionContext = Transaction<DB>;

const dialect = new PostgresDialect({
  pool: () => {
    const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
    return Promise.resolve(pool);
  },
});

export const db = new Kysely<DB>({ dialect });
