import { IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @IsNotEmpty({ message: 'Old password is required' })
  @ApiProperty({ description: "The user's old password", example: 'OldPassword123!' })
  oldPassword: string;

  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(/(?=.*[A-Z])/, { message: 'New password must contain at least one uppercase letter' })
  @Matches(/(?=.*[a-z])/, { message: 'New password must contain at least one lowercase letter' })
  @Matches(/(?=.*[0-9])/, { message: 'New password must contain at least one number' })
  @Matches(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, { message: 'New password must contain at least one special character' })
  @ApiProperty({ description: "The user's new password", example: 'NewPassword123!' })
  newPassword: string;

  @IsNotEmpty({ message: 'Confirm password is required' })
  @ApiProperty({ description: "The user's confirm password", example: 'NewPassword123!' })
  confirmPassword: string;
}
