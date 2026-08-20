import { Injectable } from '@nestjs/common';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { IEntityCustomerRepository } from './abstract_class/ientitycustomer-repository';
import { Entity_Customer } from '../models/entity_customer';
import { EntityCustomerMapper } from 'infra/database/mappers/EntityCustomerMapper';
import { Prisma } from '@prisma/client';

@Injectable()
class EntityCustomerRepository implements IEntityCustomerRepository {
  constructor(private prisma: PrismaService) {}

  async update(
    data: Entity_Customer,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const raw = EntityCustomerMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.identity.update({
      where: {
        entity_id_profile_id: {
          entity_id: data.entity_id,
          profile_id: data.profile_id,
        },
      },
      data: raw,
    });
  }
  async find_list_profile_id(profile_id: string): Promise<Entity_Customer[]> {
    const list_entity_customer = await this.prisma
      .getPrismaClient()
      .entityCustomer.findMany({
        where: {
          profile_id: profile_id,
        },
        include: {
          entity: {
            select: {
              name: true,
            },
          },
        },
      });
    return list_entity_customer.map(
      EntityCustomerMapper.toDomainCustomerWithName,
    );
  }
  async find_one(
    entity_id: string,
    profile_id: string,
  ): Promise<Entity_Customer | null> {
    const entity_customer = await this.prisma
      .getPrismaClient()
      .entityCustomer.findUnique({
        where: {
          entity_id_profile_id: {
            entity_id: entity_id,
            profile_id: profile_id,
          },
        },
      });
    if (!entity_customer) return null;
    return EntityCustomerMapper.toDomain(entity_customer);
  }

  async find_all(): Promise<Entity_Customer[]> {
    const list_entity_customer = await this.prisma
      .getPrismaClient()
      .entityCustomer.findMany();
    return list_entity_customer.map((item) =>
      EntityCustomerMapper.toDomain(item),
    );
  }

  async create(
    data: Entity_Customer,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const raw = EntityCustomerMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.entityMembership.update({
      data: raw,
    });
  }

  async find_list_entity_id(entity_id: string): Promise<Entity_Customer[]> {
    const list_entity_customer = await this.prisma
      .getPrismaClient()
      .entityCustomer.findMany({
        where: {
          entity_id: entity_id,
        },
      });
    return list_entity_customer.map((item) =>
      EntityCustomerMapper.toDomain(item),
    );
  }
}
export { EntityCustomerRepository };
