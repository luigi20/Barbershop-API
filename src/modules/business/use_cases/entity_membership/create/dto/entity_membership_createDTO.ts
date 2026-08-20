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

export class EntityMembershipCreateDTO {
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

  @IsArray()
  roles: string[];

  @IsUUID()
  entity_id: string;
}
