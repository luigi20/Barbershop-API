import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class HourPeriodDTO {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  start_time!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/)
  end_time!: string;
}

export class ReplaceHoursDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HourPeriodDTO)
  periods!: HourPeriodDTO[];
}

export class TimezoneDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  timezone!: string;
}

export class BlockDTO {
  @IsString()
  @IsNotEmpty()
  starts_at!: string;

  @IsString()
  @IsNotEmpty()
  ends_at!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
