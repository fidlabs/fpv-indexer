import type { QuarterNumberInput } from '@/lib/quarter-number';
import { IsQuarterNumberInput } from '@/lib/validators/quarter-number-input.validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceOrchestratorQuarterlyVolumeParametersDto {
  @ApiProperty({
    description: `Identifying address of an Orchestrator (not payout wallet 
      address).`,
  })
  serviceOrchestrator!: string;

  @ApiProperty({
    description: `Quarter number for which postings should be returned. Integer 
      starting from 1 optionally prefixed with Q eg. Q1 for quarter number 1.`,
    example: '1',
    type: 'string',
  })
  @IsQuarterNumberInput()
  quarterNumber!: QuarterNumberInput;
}
