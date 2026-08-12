import { IsString } from 'class-validator';

export class ValidateMFADTO {
  @IsString()
  code: string;

  @IsString()
  token: string;
}
