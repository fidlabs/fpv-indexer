import { Injectable } from '@nestjs/common';
import {
  decodeFunctionData,
  getAbiItem,
  isAddress,
  type DecodeFunctionDataReturnType,
  type Hex,
} from 'viem';
import ERC20ABI from '../abis/erc-20.abi';
import FilecoinPayV1ABI from '../abis/filecoin-pay-v1.abi';
import type { LogForEvents } from '../lib/types';
import { db, type TransactionContext } from '@/db/db';
import { AbstractIndexer, type GetLogsParameters } from './abstract.indexer';

type EventType = typeof transferEvent;
type Logs = LogForEvents<EventType>[];

const transferEvent = getAbiItem({ abi: ERC20ABI, name: 'Transfer' });

@Injectable()
export class AuctionableTokenIndexer extends AbstractIndexer<EventType> {
  public getName(): string {
    return AuctionableTokenIndexer.name;
  }

  protected async getLogs({
    client,
    contractAddress,
    fromBlock,
    toBlock,
  }: GetLogsParameters): Promise<Logs> {
    const filecoinPayContractRows = await db
      .selectFrom('filecoin_pay_contract')
      .select('contract_address')
      .execute();

    const filecoinPayAddresses = filecoinPayContractRows
      .map((row) => row.contract_address)
      .filter((maybeAddress) => isAddress(maybeAddress));

    return client.getLogs({
      address: contractAddress,
      event: transferEvent,
      args: {
        from: filecoinPayAddresses,
      },
      fromBlock,
      toBlock,
      strict: true,
    });
  }

  protected async updateDb(tx: TransactionContext, logs: Logs): Promise<void> {
    for (const log of logs) {
      const chainTx = await this.archiveNodeClient.getTransaction({
        hash: log.transactionHash,
      });
      const decodedFnData = this.safeFilecoinPayV1Decode(chainTx.input);

      if (
        decodedFnData !== null &&
        decodedFnData.functionName === 'burnForFees'
      ) {
        await tx
          .insertInto('filecoin_pay_fee_auction')
          .values({
            filecoin_pay_contract_address: log.args.from.toLowerCase(),
            tx_hash: log.transactionHash.toLowerCase(),
            log_index: log.logIndex,
            token_address: decodedFnData.args[0].toLowerCase(),
            amount_actual: log.args.value.toString(),
            fil_burned: chainTx.value.toString(),
            auctioned_at_epoch: log.blockNumber.toString(),
          })
          .executeTakeFirst();
      }
    }
  }

  private safeFilecoinPayV1Decode(
    hex: Hex,
  ): DecodeFunctionDataReturnType<typeof FilecoinPayV1ABI> | null {
    try {
      return decodeFunctionData({ abi: FilecoinPayV1ABI, data: hex });
    } catch {
      return null;
    }
  }
}
