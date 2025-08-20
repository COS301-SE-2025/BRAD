import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Tony' })
  @IsString()
  firstname: string;

  @ApiProperty({ example: 'Stark' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: 'tony@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'tony_stark' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'investigator', enum: ['admin', 'investigator', 'general'] })
  @IsIn(['admin', 'investigator', 'general'])
  role: 'admin' | 'investigator'|'general';
}