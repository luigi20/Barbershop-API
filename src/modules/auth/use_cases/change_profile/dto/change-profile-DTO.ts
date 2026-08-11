import {IsString } from 'class-validator';

export class ChangeProfileDTO {
  @IsString()
  name: string;

  @IsString()
  photo_url: string;
}
