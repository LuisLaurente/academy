import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max } from 'class-validator';

export class StartPracticeDto {
  @ApiProperty({ example: 'sub-python-101' })
  @IsString()
  sublevelId!: string;
}

export class NextQuestionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(30)
  questionIndex!: number;
}

export class SubmitAnswerDto {
  @ApiProperty({ example: 'print("Hello World")' })
  @IsString()
  answer!: string;
}

export class CompletePracticeDto {
  @ApiProperty({ example: 27 })
  @IsInt()
  @Min(0)
  @Max(30)
  correctAnswersCount!: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  @Max(100)
  totalQuestions!: number;
}
