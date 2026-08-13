import { IsBoolean, IsEmail, IsString, IsUUID } from 'class-validator';

export class MFAConfirmDTO {
  @IsEmail()
  email: string;

  @IsString()
  mfa_code: string;

  @IsUUID()
  enabled_MFA: boolean;
}
