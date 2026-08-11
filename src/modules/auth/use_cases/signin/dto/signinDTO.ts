import { IsEmail, IsString, IsUUID } from 'class-validator';

export class SignInDTO {
  @IsString()
  password: string;

  @IsUUID()
  entity_id: string;

  @IsEmail()
  email: string;
}
