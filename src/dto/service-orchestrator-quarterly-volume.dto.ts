import { ApiProperty } from '@nestjs/swagger';
import { QuarterDto } from './quarter.dto';

class PricingPeriod {
  @ApiProperty({
    description: `Epoch from which pricing period applies (inclusive).`,
    type: 'string',
    example: '110',
  })
  startEpoch!: bigint;

  @ApiProperty({
    description: `Log index from which pricing period applies (inclusive).`,
    example: 0,
  })
  startLogIndex!: number;

  @ApiProperty({
    description: `Epoch to which pricing period applies (inclusive).`,
    type: 'string',
    example: '120',
  })
  endEpoch!: bigint;

  @ApiProperty({
    description: `Log index to which pricing period applies (inclusive).`,
    example: 10,
  })
  endLogIndex!: number;

  @ApiProperty({
    description: `Amount of fees auctioned in auction that created this pricing 
      period, in atto-USD.`,
    type: 'string',
    example: 432_100_000_000_000_000_000n.toString(),
  })
  lotAttoUsd!: bigint;

  @ApiProperty({
    description: `Approximation of "lotAttoUsd" in USD.`,
    example: 432.1,
  })
  lotUsd!: number;

  @ApiProperty({
    description: `Amount of FIL burned in auction that created this pricing 
      period, in atto-FIL.`,
    type: 'string',
    example: 123_400_000_000_000_000_000n.toString(),
  })
  claimAttoFil!: bigint;

  @ApiProperty({
    description: `Approximation of "claimAttoFil" in FIL.`,
    example: 123.4,
  })
  claimFil!: number;

  @ApiProperty({
    description: `Amount of Orchestrator's FIL volume priced by this pricing 
      period, in atto-FIL.`,
    type: 'string',
    example: 123_400_000_000_000_000_000n.toString(),
  })
  volumeAttoFil!: bigint;

  @ApiProperty({
    description: `Approximation of "volumeAttoFil" in FIL.`,
    example: 123.4,
  })
  volumeFil!: number;

  @ApiProperty({
    description: `Total FIL volume of Orchestrator accrued in given pricing 
      period, converted to atto-USD and floored.`,
    type: 'string',
    example: 432_100_000_000_000_000_000n.toString(),
  })
  volumeAttoUsd!: bigint;

  @ApiProperty({
    description: `Approximation of "volumeAttoUsd" in USD.`,
    example: 432.1,
  })
  volumeUsd!: number;

  @ApiProperty({
    description: `Approximate USD/FIL ratio. Result of dividing "lotAttoUsd" by 
      "claimAttoFil".`,
    example: 1.23,
  })
  impliedRate!: string;
}

export class ServiceOrchestratorQuarterlyVolumeDto {
  @ApiProperty({
    description: `Quarter attributed to volume reported here.`,
  })
  quarter!: QuarterDto;

  @ApiProperty({
    description: `Orchestrator's total volume in given quarter. Sum of total 
      stablecoin volume and total FIL volume. This is the figure Orchestrator 
      should post after quarter end.`,
    type: 'string',
    example: 200_000_000_000_000_000_000n.toString(),
  })
  volumeAttoUsd!: bigint;

  @ApiProperty({
    description: `Approximation of "volumeAttoUsd" in USD.`,
    example: 200,
  })
  volumeUsd!: number;

  @ApiProperty({
    description: `Orchestrator's total FIL volume in given quarter. Sum of FIL 
      volume converted to USD for each pricing period.`,
    type: 'string',
    example: 100_000_000_000_000_000_000n.toString(),
  })
  filVolumeAttoUsd!: bigint;

  @ApiProperty({
    description: `Approximation of "filVolumeAttoUsd" in USD.`,
    example: 100,
  })
  filVolumeUsd!: number;

  @ApiProperty({
    description: `Orchestrator's total stablecoin volume in given quarter.`,
    type: 'string',
    example: 100_000_000_000_000_000_000n.toString(),
  })
  stablecoinVolumeAttoUsd!: bigint;

  @ApiProperty({
    description: `Approximation of "stablecoinVolumeAttoUsd" in USD.`,
    example: 100,
  })
  stablecoinVolumeUsd!: number;

  @ApiProperty({
    description: `List of pricing periods that priced FIL volume during given 
      quarter.`,
    type: PricingPeriod,
    isArray: true,
  })
  pricingPeriods!: PricingPeriod[];
}
