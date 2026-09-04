import { IndexerStatusDto } from '@/dto/indexer-status.dto';
import { IndexerOrchestratorService } from '@/services/indexer-orchestrator.service';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(
    private readonly indexerOrchestratorService: IndexerOrchestratorService,
  ) {}

  @Get('/status')
  public getStatus(): Promise<IndexerStatusDto> {
    return this.indexerOrchestratorService.getStatus();
  }
}
