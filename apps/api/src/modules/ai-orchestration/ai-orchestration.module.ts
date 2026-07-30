import { Module } from '@nestjs/common';
import { AIOrchestrationController } from './ai-orchestration.controller';

@Module({
  controllers: [AIOrchestrationController],
})
export class AIOrchestrationModule {}
