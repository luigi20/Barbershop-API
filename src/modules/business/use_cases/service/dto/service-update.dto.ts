import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ServiceStatus } from '@modules/utils/enum';
import { ServiceCreateDTO } from './service-create.dto';

export class ServiceUpdateDTO extends PartialType(ServiceCreateDTO) {
  @ApiPropertyOptional({ enum: ServiceStatus })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
