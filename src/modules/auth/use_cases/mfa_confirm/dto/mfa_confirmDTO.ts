import { IsEmail, IsString } from 'class-validator';

export class MFAConfirmDTO {
  @IsEmail()
  email: string;

  @IsString()
  mfa_code: string;

  @IsString()
  mfa_required: 'enabled' | 'disabled';

  @IsString()
  context_id: string;
}
