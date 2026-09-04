import { Address } from 'viem';

export class QuarterParametersDto {
  minLotAttoUsd!: bigint;
  minLotUsd!: number;
  minLotFloorAttoUsd!: bigint;
  minLotFloorUsd!: number;
  minLotAlphaNumerator!: bigint;
  minLotAlphaDenominator!: bigint;
  minLotAlpha!: number;
  priceBandBps!: bigint;
  priceBand!: number;
  admittedStablecoins!: Address[];
  admittedFilecoinPayContractAddresses!: Address[];
  previousQuarterPricePeriodsCount!: number;
  previousQuarterBoundVolumeAttoUsd!: bigint;
  previousQuarterBoundVolumeUsd!: number;
}
