import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsOptional,
} from 'class-validator';

export class ServiceCreateDTO {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({
    example: '35.00',
    description: 'Decimal string with two fractional digits.',
  })
  @IsString()
  @Matches(/^(0|[1-9]\d{0,7})\.\d{2}$/)
  price: string;

  @ApiProperty({ example: 45, minimum: 1, maximum: 1440 })
  @IsInt()
  @Min(1)
  @Max(1440)
  duration_minutes: number;
}
