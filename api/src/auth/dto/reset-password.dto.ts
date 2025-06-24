import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'f3a1b5c2e9f24a63a6f3e8cd0f3a1b5c',
    description: 'Token received via password reset email',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'newSecurePassword123!',
    description: 'New password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
