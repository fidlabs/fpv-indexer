import { ApiProperty } from '@nestjs/swagger';

class VolumePostingOrCorrection {
  @ApiProperty({
    description: `Identifying address of Service Orchestrator.`,
    example: '0xBD669aBd1188F52e82aF114E17aCE2842DCc0Eb4',
  })
  serviceOrchestrator!: string;

  @ApiProperty({
    description: `Volume declared or corrected in atto-USD.`,
    type: 'string',
    nullable: true,
    example: 65_432_100_000_000_000_000_000n.toString(),
  })
  volumeAttoUsd!: bigint;

  @ApiProperty({
    description: `Boolean flag telling if posting is a correction (based on 
      "VolumeCorrected" events).`,
    example: false,
  })
  correction!: boolean;

  @ApiProperty({
    description: `Epoch at posting or correction was made for given quarter.`,
    type: 'string',
    example: '111',
  })
  postingEpoch!: bigint;

  @ApiProperty({
    description: `Hash of transaction responsible for posting or correction.`,
    example:
      '0xa56a191348e7b3edc125c1ce9ac1c1cc80f5f7e3404a90af031a96f7bc5263db',
  })
  postingTxHash!: string;
}

export class ServiceOrchestratorQuarterlyVolumePostingDto {
  @ApiProperty({
    description: `Identifying address of Service Orchestrator.`,
    example: '0xBD669aBd1188F52e82aF114E17aCE2842DCc0Eb4',
  })
  serviceOrchestrator!: string;

  @ApiProperty({
    description: `Quarter number attributed to the volume posting.`,
    example: 1,
  })
  quarterNum!: number;

  @ApiProperty({
    description: `Final volume after corrections in atto-USD. Null if no volume 
      was posted or if volume was corrected to 0.`,
    type: 'string',
    nullable: true,
    example: 65_432_100_000_000_000_000_000n.toString(),
  })
  volumeAttoUsd!: bigint | null;

  @ApiProperty({
    description: `Boolean flag telling if volume was corrected after initial 
      posting by Orchestrator.`,
    example: false,
  })
  corrected!: boolean;

  @ApiProperty({
    description: `Epoch at which final volume after corrections was decided. 
      Null if "volumeAttoUsd" is null.`,
    type: 'string',
    nullable: true,
    example: '111',
  })
  postingEpoch!: bigint | null;

  @ApiProperty({
    description: `Hash of transaction that decided the final volume. Null if 
      "volumeAttoUsd" is null.`,
    type: 'string',
    nullable: true,
    example:
      '0xa56a191348e7b3edc125c1ce9ac1c1cc80f5f7e3404a90af031a96f7bc5263db',
  })
  postingTxHash!: string | null;

  @ApiProperty({
    description: `List of all Orchestrator postings and corections made.`,
    type: VolumePostingOrCorrection,
    isArray: true,
  })
  postings!: VolumePostingOrCorrection[];
}
