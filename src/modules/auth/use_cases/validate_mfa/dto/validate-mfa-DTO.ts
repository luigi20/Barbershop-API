import { IsEmail, IsString } from 'class-validator';

export class ValidateMFADTO {
  @IsString()
  entity_id: string;

  @IsString()
  context_id: string;

  @IsString()
  code: string;

  @IsString()
  token: string;
}
