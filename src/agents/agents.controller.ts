import { Controller, Post, Body } from '@nestjs/common';
import { OrchestratorService } from './services/orchestrator.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post('generate')
  async generateCode(@Body('goal') goal: string) {
    if (!goal) {
      return { error: 'Please provide a goal' };
    }
    
    // We launch the workflow here
    // In a prod app, we might return an async job ID
    // For this POC, we await the full result
    const result = await this.orchestratorService.runWorkflow(goal);
    
    return {
      message: 'Agent workflow successfully completed',
      result,
    };
  }
}
