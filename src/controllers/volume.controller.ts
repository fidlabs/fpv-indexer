import { ServiceOrchestratorQuarterlyVolumeParametersDto } from '@/dto/service-orchestrator-quarterly-volume-parameters.dto';
import { ServiceOrchestratorQuarterlyVolumeDto } from '@/dto/service-orchestrator-quarterly-volume.dto';
import { VolumeCalculationService } from '@/services/volume-calculation.service';
import { Controller, Get, Param, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('/volume')
export class VolumeController {
  constructor(
    private readonly volumeCalculationService: VolumeCalculationService,
  ) {}

  @Get('/:quarterNumber/:serviceOrchestrator')
  @ApiOperation({
    summary: 'Get quarterly volume of service orchestrator with details',
  })
  @ApiOkResponse({
    description: `Service Orchestrator volume details in given quarter along 
      with FIL pricing prints.`,
    type: ServiceOrchestratorQuarterlyVolumeDto,
  })
  public getServiceOrchestratorQuarterlyVolume(
    @Param(new ValidationPipe({ transform: true }))
    params: ServiceOrchestratorQuarterlyVolumeParametersDto,
  ): Promise<ServiceOrchestratorQuarterlyVolumeDto> {
    return this.volumeCalculationService.getServiceOrchestratorQuarterlyVolume(
      params,
    );
  }
}
