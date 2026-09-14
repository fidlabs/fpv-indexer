import { db } from '@/db/db';
import { AbstractIndexer } from './abstract.indexer';
import { vi, Mock } from 'vitest';

vi.mock('@/db/db', () => ({
  db: {
    selectFrom: vi.fn(),
    transaction: vi.fn(),
  },
}));

class TestIndexer extends AbstractIndexer<any> {
  public readonly seen: number[] = [];

  public getName() {
    return 'TestIndexer';
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getLogs() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return [
      { blockNumber: 2n, transactionIndex: 0, logIndex: 0 },
      { blockNumber: 1n, transactionIndex: 1, logIndex: 0 },
      { blockNumber: 1n, transactionIndex: 0, logIndex: 4 },
      { blockNumber: 1n, transactionIndex: 0, logIndex: 2 },
    ] as any;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async updateDb(_tx: any, logs: any[]) {
    this.seen.push(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ...logs.map(
        (log) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          Number(log.blockNumber) * 100 +
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          log.transactionIndex * 10 +
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          log.logIndex,
      ),
    );
  }
}

describe('AbstractIndexer', () => {
  it('sorts logs by block number, transaction index, and log index before updating storage', async () => {
    const select = (db.selectFrom as Mock).mockReturnValue({
      selectAll: () => ({
        where: () => ({
          // eslint-disable-next-line @typescript-eslint/require-await
          orderBy: () => ({ executeTakeFirst: async () => undefined }),
        }),
      }),
    });
    expect(select).toBeDefined();

    const execute = vi.fn(async (callback: (tx: any) => Promise<void>) =>
      callback({
        insertInto: () => ({
          values: () => ({
            onConflict: () => ({
              // eslint-disable-next-line @typescript-eslint/require-await
              executeTakeFirst: async () => undefined,
            }),
          }),
        }),
      }),
    );
    (db.transaction as Mock).mockReturnValue({ execute });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await
    const recentClient = { getBlockNumber: async () => 2n } as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const config = { get: vi.fn(() => undefined) } as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const indexer = new TestIndexer(config, recentClient, {} as any);

    await indexer.run({
      contractAddress: '0x0000000000000000000000000000000000000001',
      minBlockNumber: 1n,
      maxBlockNumber: null,
    });

    expect(indexer.seen).toEqual([102, 104, 110, 200]);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
