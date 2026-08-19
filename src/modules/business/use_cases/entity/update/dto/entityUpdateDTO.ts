import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class EntityUpdateDTO {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  type: string;

  @IsString()
  document: string;

  @IsString()
  phone: string;

  @IsString()
  photo: string;

  @IsString()
  status: string;
}
