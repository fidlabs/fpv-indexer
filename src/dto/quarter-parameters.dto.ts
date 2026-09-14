import { ApiProperty } from '@nestjs/swagger';
import { Address } from 'viem';

export class QuarterParametersDto {
  @ApiProperty({
    description: `Minimum lot for Filecoin Pay auction to qualify as a pricing 
      print for FIL volume, in attoUSD, calculated as described in FIP-0118.`,
    type: 'string',
    example: '500000000000000000',
  })
  minLotAttoUsd!: bigint;

  @ApiProperty({
    description: `Approximation of "minLotAttoUsd" in USD.`,
    example: 0.5,
  })
  minLotUsd!: number;

  @ApiProperty({
    description: `Minimum lot floor in atto-USD.`,
    type: 'string',
    example: '500000000000000000',
  })
  minLotFloorAttoUsd!: bigint;

  @ApiProperty({
    description: `Approximation of "minLotFloorAttoUsd" in USD.`,
    example: 0.5,
  })
  minLotFloorUsd!: number;

  @ApiProperty({
    description: `Numerator part of MIN_LOT_ALPHA`,
    type: 'string',
    example: '1',
  })
  minLotAlphaNumerator!: bigint;

  @ApiProperty({
    description: `Denominator part of MIN_LOT_ALPHA`,
    type: 'string',
    example: '400',
  })
  minLotAlphaDenominator!: bigint;

  @ApiProperty({
    description: `Approximate result of dividing "minLotAlphaNumerator" by 
      "minLotAlphaDenominator".`,
    example: 0.0025,
  })
  minLotAlpha!: number;

  @ApiProperty({
    description: 'Price band in basis points.',
    type: 'string',
    example: '3000',
  })
  priceBandBps!: bigint;

  @ApiProperty({
    description: `Approximate result of dividing "priceBandBps" by 10000.`,
    example: 0.3,
  })
  priceBand!: number;

  @ApiProperty({
    description: 'List of stablecoins addresses admitted in given quarter.',
    type: 'string',
    isArray: true,
    example: [
      '0x80b98d3aa09ffff255c3ba4a241111ff1262f045',
      '0xeb466342c4d449bc9f53a865d5cb90586f405215',
    ],
  })
  admittedStablecoins!: Address[];

  @ApiProperty({
    description: `List of Filecoin Pay contract addresses admitted in given 
      quarter.`,
    type: 'string',
    isArray: true,
    example: ['0x23b1e018f08bb982348b15a86ee926eebf7f4daa'],
  })
  admittedFilecoinPayContractAddresses!: Address[];

  @ApiProperty({
    description: `Number of qualified pricing periods in previous quarter. 
      Used in calculating "minLotAttoUsd".`,
    example: 12,
  })
  previousQuarterPricePeriodsCount!: number;

  @ApiProperty({
    description: `Total volume posted by Orchestrators in previous quarter. 
      Used in calculating "minLotAttoUsd".`,
    type: 'string',
    example: 3_200_000_000_000_000_000_000n.toString(),
  })
  previousQuarterBoundVolumeAttoUsd!: bigint;

  @ApiProperty({
    description: `Approximation of "previousQuarterBoundVolumeAttoUsd" in USD.`,
    example: 3200,
  })
  previousQuarterBoundVolumeUsd!: number;
}
