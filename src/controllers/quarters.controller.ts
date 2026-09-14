import { QuarterParametersRouterParamsDto } from '@/dto/quarter-parameters-router-params.dto';
import { QuarterParametersDto } from '@/dto/quarter-parameters.dto';
import { QuarterDto } from '@/dto/quarter.dto';
import { ServiceOrchestratorQuarterlyVolumeParametersDto } from '@/dto/service-orchestrator-quarterly-volume-parameters.dto';
import { ServiceOrchestratorQuarterlyVolumePostingDto } from '@/dto/service-orchestrator-quarterly-volume-posting.dto';
import { QuartersService } from '@/services/quarters.service';
import { Controller, Get, Param, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('/quarters')
export class QuartersController {
  constructor(private readonly quartersService: QuartersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of quarters with their boundaries.',
  })
  @ApiOkResponse({
    description: 'List of quarters with their boundaries.',
    type: QuarterDto,
    isArray: true,
  })
  getQuarters(): Promise<QuarterDto[]> {
    return this.quartersService.getQuarters();
  }

  @Get('/:quarterNum/parameters')
  @ApiOperation({
    summary:
      'Get parameters for given quarters, like admitted lists, pricing parameters etc.',
  })
  @ApiOkResponse({
    description: 'Quarter parameters.',
    type: QuarterParametersDto,
  })
  public getQuarterParameters(
    @Param(new ValidationPipe({ transform: true }))
    params: QuarterParametersRouterParamsDto,
  ): Promise<QuarterParametersDto> {
    return this.quartersService.getQuarterParameters(params.quarterNumber);
  }

  @Get('/:quarterNumber/postings/:serviceOrchestrator')
  @ApiOperation({
    summary: 'Get posted volume for Orchestrator in given quarter.',
  })
  @ApiOkResponse({
    description: 'Posted volume information with list of corrections.',
    type: ServiceOrchestratorQuarterlyVolumePostingDto,
  })
  public getQuarterPostings(
    @Param(new ValidationPipe({ transform: true }))
    params: ServiceOrchestratorQuarterlyVolumeParametersDto,
  ): Promise<ServiceOrchestratorQuarterlyVolumePostingDto> {
    return this.quartersService.getServiceOrchestratorsQuarterlyVolumePostings(
      params,
    );
  }
}
