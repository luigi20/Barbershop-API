import { IsEmail, IsString } from 'class-validator';

export class Social_LoginDTO {
  @IsString()
  token: string;

  @IsString()
  provider: string;

  @IsString()
  context_id: string;
}
