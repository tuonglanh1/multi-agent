import { Module } from '@nestjs/common';
import { OrchestratorService } from './services/orchestrator.service';
import { AgentsController } from './agents.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Provide access to .env automatically
  controllers: [AgentsController],
  providers: [OrchestratorService],
})
export class AgentsModule {}
