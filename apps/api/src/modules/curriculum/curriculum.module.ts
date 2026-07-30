import { Module } from '@nestjs/common';
import { CurriculumController } from './curriculum.controller';
import { CurriculumGenerationService } from './curriculum-generation.service';

@Module({
  controllers: [CurriculumController],
  providers: [CurriculumGenerationService],
  exports: [CurriculumGenerationService],
})
export class CurriculumModule {}
