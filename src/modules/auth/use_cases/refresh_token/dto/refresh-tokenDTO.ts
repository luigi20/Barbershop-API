import { IsString } from 'class-validator';

export class RefreshTokenDTO {
  @IsString()
  refresh_token: string;
}
