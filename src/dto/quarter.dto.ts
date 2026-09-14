import { ApiProperty } from '@nestjs/swagger';

export class QuarterDto {
  @ApiProperty({
    description: 'Quarter number. Integer starting from 1.',
    example: '1',
  })
  q!: number;

  @ApiProperty({
    description: 'Starting epoch of a quarter, inclusive.',
    example: 100,
  })
  startEpoch!: bigint;

  @ApiProperty({
    description: 'Ending epoch of a quarter, inclusive.',
    example: 110,
  })
  endEpoch!: bigint;
}
