import { Prisma, Service as PrismaServiceModel } from '@prisma/client';
import { BarberService } from '@modules/business/service/shared/models/service';
import { ServiceStatus } from '@modules/utils/enum';

export class ServiceMapper {
  static toPrisma(service: BarberService) {
    return {
      id: service.id,
      entity_id: service.entity_id,
      name: service.name,
      description: service.description,
      price: new Prisma.Decimal(service.price),
      duration_minutes: service.duration_minutes,
      status: service.status,
      created_at: service.created_at,
      updated_at: service.updated_at,
    };
  }

  static toDomain(raw: PrismaServiceModel): BarberService {
    return new BarberService(
      {
        entity_id: raw.entity_id,
        name: raw.name,
        description: raw.description,
        price: raw.price.toFixed(2),
        duration_minutes: raw.duration_minutes,
        status: raw.status as ServiceStatus,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      },
      raw.id,
    );
  }
}
