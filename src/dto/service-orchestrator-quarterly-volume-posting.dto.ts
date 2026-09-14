class Posting {
  serviceOrchestrator!: string;
  volumeAttoUsd!: bigint;
  correction!: boolean;
  postingEpoch!: bigint;
  postingTxHash!: string;
}

export class ServiceOrchestratorQuarterlyVolumePostingDto {
  serviceOrchestrator!: string;
  quarterNum!: number;
  volumeAttoUsd!: bigint | null;
  corrected!: boolean;
  postingEpoch!: bigint | null;
  postingTxHash!: string | null;
  postings!: Posting[];
}
