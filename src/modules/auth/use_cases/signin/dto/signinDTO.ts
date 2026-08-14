import { IsEmail, IsString, IsUUID } from 'class-validator';

export class SignInDTO {
  @IsString()
  password: string;

  @IsEmail()
  email: string;
}
