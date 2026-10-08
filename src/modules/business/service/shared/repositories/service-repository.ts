import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { ServiceMapper } from 'infra/database/mappers/ServiceMapper';
import { BarberService } from '../models/service';
import { IServiceRepository } from './iservice-repository';

@Injectable()
export class ServiceRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(service: BarberService, tx?: Prisma.TransactionClient) {
    const row = await (tx ?? this.prisma.getPrismaClient()).service.create({
      data: ServiceMapper.toPrisma(service),
    });
    return ServiceMapper.toDomain(row);
  }

  async findByIdAndEntity(
    id: string,
    entityId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const row = await (tx ?? this.prisma.getPrismaClient()).service.findFirst({
      where: { id, entity_id: entityId },
    });
    return row ? ServiceMapper.toDomain(row) : null;
  }

  async findManyByEntity(entityId: string, tx?: Prisma.TransactionClient) {
    const rows = await (tx ?? this.prisma.getPrismaClient()).service.findMany({
      where: { entity_id: entityId },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => ServiceMapper.toDomain(row));
  }

  async update(service: BarberService, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma.getPrismaClient();
    const result = await client.service.updateMany({
      where: { id: service.id, entity_id: service.entity_id },
      data: {
        name: service.name,
        description: service.description,
        price: new Prisma.Decimal(service.price),
        duration_minutes: service.duration_minutes,
        status: service.status,
        updated_at: service.updated_at,
      },
    });
    if (result.count === 0) return null;
    return this.findByIdAndEntity(service.id, service.entity_id, tx);
  }
}
