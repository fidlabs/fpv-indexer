import { db, TransactionContext } from '@/db/db';
import {
  ARCHIVE_NODE_CLIENT,
  packageMajorVersion,
  RECENT_NODE_CLIENT,
} from '@/lib/constants';
import type {
  ConfigShape,
  FilecoinPublicClient,
  IndexerRunParameters,
  LogForEvents,
} from '@/lib/types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AbiEvent, Address, Log } from 'viem';

export interface GetLogsParameters {
  client: FilecoinPublicClient;
  contractAddress: Address;
  fromBlock: bigint;
  toBlock: bigint;
}

@Injectable()
export abstract class AbstractIndexer<EventType extends AbiEvent> {
  public static DEFAULT_BATCH_BLOCK_SIZE = 2n * 60n * 12n;

  public abstract getName(): string;
  protected abstract getLogs(
    parameters: GetLogsParameters,
  ): Promise<LogForEvents<EventType>[]>;
  protected abstract updateDb(
    txContext: TransactionContext,
    logs: LogForEvents<EventType>[],
  ): Promise<void>;
  protected logger: Logger;

  constructor(
    protected readonly configService: ConfigService<ConfigShape, true>,
    @Inject(RECENT_NODE_CLIENT)
    protected readonly recentNodeClient: FilecoinPublicClient,
    @Inject(ARCHIVE_NODE_CLIENT)
    protected readonly archiveNodeClient: FilecoinPublicClient,
  ) {
    this.logger = new Logger(`${this.getName()}`);
  }

  public async run(parameters: IndexerRunParameters) {
    const { contractAddress, minBlockNumber, maxBlockNumber } = parameters;
    this.logger = new Logger(`${this.getName()}:${contractAddress}`);
    const logger = this.logger;

    const lastRun = await db
      .selectFrom('indexer_state')
      .selectAll()
      .where('contract_address', '=', contractAddress)
      .orderBy('last_run_date', 'desc')
      .executeTakeFirst();

    if (
      maxBlockNumber !== null &&
      !!lastRun &&
      BigInt(lastRun.end_block) >= maxBlockNumber
    ) {
      logger.log('Nothing to index.');
      return;
    }

    const currentBlock = await this.recentNodeClient.getBlockNumber();
    const fromBlock = !lastRun
      ? minBlockNumber
      : BigInt(lastRun.end_block) + 1n;

    if (fromBlock >= currentBlock) {
      logger.log('Nothing to index.');
      return;
    }

    const blockDifference = currentBlock - fromBlock;
    const configuredBatchBlockSize = this.configService.get(
      'BATCH_BLOCK_SIZE',
      { infer: true },
    );
    const batchBlockSize =
      typeof configuredBatchBlockSize === 'number'
        ? BigInt(configuredBatchBlockSize)
        : AbstractIndexer.DEFAULT_BATCH_BLOCK_SIZE;
    const toBlock =
      blockDifference >= batchBlockSize
        ? fromBlock + batchBlockSize - 1n
        : currentBlock;
    const shouldUseArchiveNode =
      blockDifference >= this.configService.get('ARCHIVE_RPC_THRESHOLD');
    const publicClient = shouldUseArchiveNode
      ? this.archiveNodeClient
      : this.recentNodeClient;

    logger.log(
      `Fetching logs in block range [${fromBlock.toString()}-${toBlock.toString()}] using ${shouldUseArchiveNode ? '"Archive Node"' : '"Recent Node"'}`,
    );

    const logs = await this.getLogs({
      client: publicClient,
      contractAddress,
      fromBlock,
      toBlock,
    });
    const logsSorted = this.sortLogs(logs);

    await db.transaction().execute(async (tx) => {
      await this.updateDb(tx, logsSorted);

      await tx
        .insertInto('indexer_state')
        .values({
          contract_address: contractAddress.toLowerCase(),
          version: packageMajorVersion,
          last_run_date: new Date(),
          end_block: toBlock.toString(),
        })
        .onConflict((oc) => {
          return oc.column('contract_address').doUpdateSet({
            version: packageMajorVersion,
            last_run_date: new Date(),
            end_block: toBlock.toString(),
          });
        })
        .executeTakeFirst();
    });

    const logsCount = logs.length;
    const keepRunning = currentBlock !== toBlock;

    logger.log(
      keepRunning
        ? `Indexed ${logsCount} logs up to block ${toBlock.toString()}. Scheduling another run.`
        : `Finished indexing ${logsCount} logs.`,
    );

    // keep indexing if we havent synced up
    if (keepRunning) {
      await this.run(parameters);
    }
  }

  private sortLogs<T extends Log>(logs: T[]): T[] {
    return [...logs].sort((a, b) => {
      const isSameBlockNUmber =
        (a.blockNumber === null && b.blockNumber === null) ||
        (a.blockNumber !== null &&
          b.blockNumber !== null &&
          a.blockNumber === b.blockNumber);

      if (isSameBlockNUmber) {
        if (a.logIndex === null) {
          return -1;
        }

        if (b.logIndex === null) {
          return 1;
        }

        return a.logIndex - b.logIndex;
      }

      if (a.blockNumber === null) {
        return -1;
      }

      if (b.blockNumber === null) {
        return 1;
      }

      return a.blockNumber > b.blockNumber ? 1 : -1;
    });
  }
}
