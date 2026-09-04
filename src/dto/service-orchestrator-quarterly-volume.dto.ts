import { QuarterDto } from './quarter.dto';

class PricingPeriod {
  startEpoch!: bigint;
  startLogIndex!: number;
  endEpoch!: bigint | null;
  endLogIndex!: number | null;
  lotAttoUsd!: bigint;
  lotUsd!: number;
  claimAttoFil!: bigint;
  claimFil!: number;
  volumeAttoFil!: bigint;
  volumeFil!: number;
  volumeAttoUsd!: bigint;
  volumeUsd!: number;
  impliedRate!: string;
}

export class ServiceOrchestratorQuarterlyVolumeDto {
  quarter!: QuarterDto;

  volumeAttoUsd!: bigint;

  volumeUsd!: number;

  filVolumeAttoUsd!: bigint;

  filVolumeUsd!: number;

  stablecoinVolumeAttoUsd!: bigint;

  stablecoinVolumeUsd!: number;

  pricingPeriods!: PricingPeriod[];
}
