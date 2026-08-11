import { IsString } from 'class-validator';

export class LogoutDTO {
  @IsString()
  refresh_token: string;
}
