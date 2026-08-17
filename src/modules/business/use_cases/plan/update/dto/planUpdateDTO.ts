import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class PlanUpdateDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  max_members: number;

  @IsNumber()
  max_customers: number;

  @IsNumber()
  max_appointments: number;

  @IsBoolean()
  active: boolean;
}
