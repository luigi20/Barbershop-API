import { IsEmail, IsString } from 'class-validator';

export class PasswordResetDTO {
  @IsEmail()
  email: string;

  @IsString()
  token: string;

  @IsString()
  new_password: string;

  @IsString()
  context_id: string;
}
