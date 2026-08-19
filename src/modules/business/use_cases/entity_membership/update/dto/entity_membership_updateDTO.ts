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

export class EntityMembershipUpdateDTO {
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

  @IsArray()
  roles: string[];

  @IsUUID()
  identity_id: string;

  @IsUUID()
  entity_id: string;
}
