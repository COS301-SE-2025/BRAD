import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
    @IsString()
    firstname: string;
  
    @IsString()
    lastname: string;
  
    @IsEmail()
    email: string;
  
    @IsString()
    username: string;
  
    @IsString()
    @MinLength(6)
    password: string;
  
    @IsIn(['admin', 'investigator'])
    role: 'admin' | 'investigator';
  }
  