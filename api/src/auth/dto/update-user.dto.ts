import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateUserDto {
    @ApiProperty({ description: 'First name of the user', example: 'John' })
    @IsOptional()
    @IsString()
    firstname?: string;

 @ApiProperty({ description: 'Last name of the user', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastname?: string;

 @ApiProperty({ description: 'Username of the user', example: 'johndoe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: 'Email of the user', example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Current password for verification', example: 'Password123' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string; 
}