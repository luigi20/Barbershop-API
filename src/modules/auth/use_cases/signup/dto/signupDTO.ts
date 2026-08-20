import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SignUpDTO {
  @IsString()
  name: string;

  @IsString()
  password: string;

  @IsString()
  entity_type: string;

  @IsString()
  entity_name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  photo: string;

  @IsString()
  document: string;

  @IsString()
  birth_date: string;
}
