import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddAdminDto {
    @ApiProperty({ example: '665d5f9b3f5c2e2a88e98b91', description: 'User ID to promote to admin' })
    userId: string;
  @IsNotEmpty() firstname: string;
  @IsNotEmpty() lastname: string;
  @IsEmail() email: string;
  @IsNotEmpty() username: string;
  @MinLength(6) password: string;
}
