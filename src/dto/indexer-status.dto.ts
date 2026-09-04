class ContractState {
  address!: string;

  indexedUpTo!: bigint;
}

export class IndexerStatusDto {
  version!: string;

  indexedUpTo!: bigint;

  isRunning!: boolean;

  contracts!: ContractState[];
}
