import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'student@academy.edu' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginUserDto {
  @ApiProperty({ example: 'student@academy.edu' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  password!: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'user-uuid-123' })
  userId!: string;

  @ApiProperty({ example: 'student@academy.edu' })
  email!: string;

  @ApiProperty({ example: 'mock-jwt-token-string' })
  accessToken!: string;

  @ApiProperty({ example: 'student' })
  role!: string;
}
