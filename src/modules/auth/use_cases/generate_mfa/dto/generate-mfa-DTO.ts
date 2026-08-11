import { IsEmail, IsString } from 'class-validator';

export class GenerateMFADTO {
  @IsEmail()
  email: string;

  @IsString()
  context_id: string;
}
