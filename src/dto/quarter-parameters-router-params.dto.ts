import type { QuarterNumberInput } from '@/lib/quarter-number';
import { IsQuarterNumberInput } from '@/lib/validators/quarter-number-input.validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuarterParametersRouterParamsDto {
  @ApiProperty({
    description: `Quarter number for which result should be returned. Integer 
      starting from 1 optionally prefixed with Q eg. Q1 for quarter number 1.`,
    example: '1',
    type: 'string',
  })
  @IsQuarterNumberInput()
  quarterNumber!: QuarterNumberInput;
}
