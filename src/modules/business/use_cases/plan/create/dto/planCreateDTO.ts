import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class PlanCreateDTO {
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
