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

export class EntityCustomerUpdateDTO {
  @IsString()
  @IsDate()
  birth_date: Date;

  @IsEmail()
  email: string;

  @IsBoolean()
  mfa_required: boolean;

  @IsString()
  name: string;

  @IsString()
  status: string;

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
