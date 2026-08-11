import { IsEmail, IsString } from 'class-validator';

export class MFARequestDTO {
  @IsEmail()
  email: string;

  @IsString()
  context_id: string;
}
