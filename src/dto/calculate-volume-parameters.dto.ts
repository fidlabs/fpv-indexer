import { IsInt } from 'class-validator';

export class CalculateVolumeParametersDto {
  @IsInt()
  quarter!: number;

  serviceOrcherstrator!: string;
}
