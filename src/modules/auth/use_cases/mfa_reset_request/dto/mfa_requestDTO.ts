import { IsEmail, IsString } from 'class-validator';

export class MFARequestDTO {
  @IsEmail()
  email: string;
}
