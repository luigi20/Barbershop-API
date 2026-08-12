import { IsString, IsUUID } from 'class-validator';

export class ChangeProfileDTO {
  @IsString()
  name: string;

  @IsString()
  photo_url: string;

  @IsString()
  birth_date: string;

  @IsString()
  phone: string;
}
