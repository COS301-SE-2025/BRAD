import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'one time created password' })
  @IsString()
  @MinLength(6)
  OTP: string;

  @ApiProperty({ example: 'new password' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}