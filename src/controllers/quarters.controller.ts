import { QuarterParametersRouterParamsDto } from '@/dto/quarter-parameters-router-params.dto';
import { QuarterParametersDto } from '@/dto/quarter-parameters.dto';
import { QuarterDto } from '@/dto/quarter.dto';
import { QuartersService } from '@/services/quarters.service';
import { Controller, Get, Param, ValidationPipe } from '@nestjs/common';

@Controller('/quarters')
export class QuartersController {
  constructor(private readonly quartersService: QuartersService) {}

  @Get()
  getQuarters(): Promise<QuarterDto[]> {
    return this.quartersService.getQuarters();
  }

  @Get('/:quarterNum/parameters')
  public getQuarterParameters(
    @Param(new ValidationPipe({ transform: true }))
    params: QuarterParametersRouterParamsDto,
  ): Promise<QuarterParametersDto> {
    return this.quartersService.getQuarterParameters(params.quarterNum);
  }
}
