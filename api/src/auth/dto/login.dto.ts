import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'tony_stark or tony@example.com',
    description: 'Username or email used to identify the user',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
