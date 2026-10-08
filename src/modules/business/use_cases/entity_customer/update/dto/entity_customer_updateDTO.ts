import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CustomerStatus } from '@modules/utils/enum';
export class EntityCustomerUpdateDTO {
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() entity_id?: string;
  @ApiProperty() @IsUUID() customer_id: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  status: CustomerStatus;
}
