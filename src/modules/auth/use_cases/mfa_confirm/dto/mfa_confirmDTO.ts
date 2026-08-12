import { IsBoolean, IsEmail, IsString, IsUUID } from 'class-validator';

export class MFAConfirmDTO {
  @IsEmail()
  email: string;

  @IsString()
  mfa_code: string;

  @IsUUID()
  identity_id: string;
}
