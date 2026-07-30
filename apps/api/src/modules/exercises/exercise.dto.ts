import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ExerciseDto {
  @ApiProperty({ example: 'ex-101' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Implement User Entity' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Write a typescript class for User' })
  @IsString()
  prompt!: string;

  @ApiProperty({ example: 'code' })
  @IsString()
  exerciseType!: string;

  @ApiProperty({ example: 'hard' })
  @IsString()
  difficulty!: string;
}
