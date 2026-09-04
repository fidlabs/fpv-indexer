import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class QuarterParametersRouterParamsDto {
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    return parseInt(String(value), 10);
  })
  quarterNum!: number;
}
