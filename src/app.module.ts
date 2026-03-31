import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [ConfigModule.forRoot(), AgentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
