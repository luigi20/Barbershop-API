import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAppointmentDTO {
  @IsUUID()
  customer_id!: string;

  @IsUUID()
  professional_profile_id!: string;

  @IsUUID()
  service_id!: string;

  @IsString()
  starts_at!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class RescheduleAppointmentDTO {
  @IsString()
  starts_at!: string;

  @IsOptional()
  @IsUUID()
  professional_profile_id?: string;
}

export class CancelAppointmentDTO {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
