import { ServiceOrchestratorQuarterlyVolumeParametersDto } from '@/dto/service-orchestrator-quarterly-volume-parameters.dto';
import { ServiceOrchestratorQuarterlyVolumeDto } from '@/dto/service-orchestrator-quarterly-volume.dto';
import { VolumeCalculationService } from '@/services/volume-calculation.service';
import { Controller, Get, Param, ValidationPipe } from '@nestjs/common';

@Controller('/volume')
export class VolumeController {
  constructor(
    private readonly volumeCalculationService: VolumeCalculationService,
  ) {}

  @Get('/:quarterNumber/:serviceOrchestrator')
  public getQuarterParameters(
    @Param(new ValidationPipe({ transform: true }))
    params: ServiceOrchestratorQuarterlyVolumeParametersDto,
  ): Promise<ServiceOrchestratorQuarterlyVolumeDto> {
    return this.volumeCalculationService.getServiceOrchestratorQuarterlyVolume(
      params,
    );
  }
}
