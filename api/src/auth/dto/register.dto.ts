import { IsEmail, IsNotEmpty, Matches, MinLength, IsBoolean, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Tony', description: 'First name of the user' })
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: 'Stark', description: 'Last name of the user' })
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: 'tony@example.com', description: 'Valid email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'tony_stark',
    description: 'Username (alphanumeric, underscore, dash, or dot)',
  })
  @Matches(/^[A-Za-z0-9_.-]+$/, { message: 'Invalid username format' })
  username: string;

  @ApiProperty({
    example: 'strongPassword1!',
    description: 'Password with minimum 6 characters',
    minLength: 6,
  })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: true,
    description: 'User consent to data handling / privacy policy',
  })
  @IsBoolean()
  @Equals(true, { message: 'You must agree to the data handling policy.' })
  consent: boolean;
}
