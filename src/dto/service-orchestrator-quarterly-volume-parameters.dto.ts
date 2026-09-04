import type { QuarterNumberInput } from '@/lib/quarter-number';
import { IsQuarterNumberInput } from '@/lib/validators/quarter-number-input.validator';

export class ServiceOrchestratorQuarterlyVolumeParametersDto {
  serviceOrchestrator!: string;

  @IsQuarterNumberInput()
  quarterNumber!: QuarterNumberInput;
}
