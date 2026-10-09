import {
  type AbiEvent,
  type Address,
  type GetLogsReturnType,
  type HttpTransport,
  type PublicClient,
} from 'viem';
import type { infer as zodInfer } from 'zod';
import type { CONFIG_SCHEMA, SUPPORTED_CHAINS } from './constants';

type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export type FilecoinCid = {
  '/': string;
};

export type FilecoinFinalizedTipset = {
  Cids: FilecoinCid[];
  Blocks: unknown[];
  Height: number;
};

export type FilecoinRpcSchema = [
  {
    Method: 'Filecoin.ChainGetFinalizedTipSet';
    Parameters: [];
    ReturnType: FilecoinFinalizedTipset;
  },
];

export type FilecoinActions = {
  filecoin: {
    chainGetFinalizedTipSet: () => Promise<FilecoinFinalizedTipset>;
  };
};

export type FilecoinPublicClient = PublicClient<
  HttpTransport,
  SupportedChain,
  undefined,
  FilecoinRpcSchema
> &
  FilecoinActions;

export type ConfigShape = zodInfer<typeof CONFIG_SCHEMA>;

export interface FilecoinPayIndexParameters {
  contractAddress: Address;
  minBlockNumber: bigint;
  maxBlockNumber: bigint | null;
}

export interface IndexerRunParameters {
  contractAddress: Address;
  minBlockNumber: bigint;
  maxBlockNumber: bigint | null;
}

export type LogForEvents<EventType extends AbiEvent> = GetLogsReturnType<
  undefined,
  EventType[],
  true,
  bigint,
  bigint
>[number];

export interface ERC20Metadata {
  decimals: number;
  symbol: string;
}
