import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class EntityCustomerCreateDTO {
  @IsString()
  birth_date: string;

  @IsEmail()
  email: string;

  @IsBoolean()
  mfa_required: boolean;

  @IsString()
  name: string;

  @IsString()
  password: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  photo: string;

  @IsString()
  notes: string;

  @IsUUID()
  entity_id: string;
}
