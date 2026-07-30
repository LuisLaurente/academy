import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';

@Module({
  controllers: [ExerciseController],
})
export class ExerciseModule {}
