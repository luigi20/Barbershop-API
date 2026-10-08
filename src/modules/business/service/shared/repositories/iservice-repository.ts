import { Prisma } from '@prisma/client';
import { BarberService } from '../models/service';

export abstract class IServiceRepository {
  abstract create(
    service: BarberService,
    tx?: Prisma.TransactionClient,
  ): Promise<BarberService>;
  abstract findByIdAndEntity(
    id: string,
    entityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<BarberService | null>;
  abstract findManyByEntity(
    entityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<BarberService[]>;
  abstract update(
    service: BarberService,
    tx?: Prisma.TransactionClient,
  ): Promise<BarberService | null>;
}
