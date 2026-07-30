import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ example: 'student-uuid-400' })
  @IsString()
  studentId!: string;

  @ApiProperty({ example: ['item-1', 'item-2'] })
  @IsArray()
  itemIds!: readonly string[];
}

export class CompleteSessionItemDto {
  @ApiProperty({ example: 'item-1' })
  @IsString()
  itemId!: string;
}

export class SessionResponseDto {
  @ApiProperty({ example: 'session-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'student-uuid-400' })
  studentId!: string;

  @ApiProperty({ example: 'active' })
  status!: string;

  @ApiProperty({ example: 0 })
  completedCount!: number;
}
