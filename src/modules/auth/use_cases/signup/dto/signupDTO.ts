import { IsDate, IsEmail, IsString, IsUUID } from 'class-validator';

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

  @IsString()
  photo: string;

  @IsDate()
  birth_date: Date;
}
