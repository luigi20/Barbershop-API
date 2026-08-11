import { Injectable } from '@nestjs/common';
import { IEntityMembershipRepository } from './abstract_class/ientitymembership-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { Entity_Membership } from '../models/entity_membership';
import { EntityMembershipMapper } from 'infra/database/mappers/EntityMembership';
import { Prisma } from '@prisma/client';

@Injectable()
class EntityMembershipRepository implements IEntityMembershipRepository {
  constructor(private prisma: PrismaService) {}
  async find_one(
    entity_id: string,
    profile_id: string,
  ): Promise<Entity_Membership | null> {
    const entity_membership = await this.prisma
      .getPrismaClient()
      .entityMembership.findUnique({
        where: {
          entity_id_profile_id: {
            entity_id: entity_id,
            profile_id: profile_id,
          },
        },
      });
    if (!entity_membership) return null;
    return EntityMembershipMapper.toDomain(entity_membership);
  }

  async update(data: Entity_Membership): Promise<void> {
    const raw = EntityMembershipMapper.toPrisma(data);
    await this.prisma.getPrismaClient().entityMembership.update({
      where: {
        entity_id_profile_id: {
          entity_id: data.entity_id,
          profile_id: data.profile_id,
        },
      },
      data: raw,
    });
  }

  async create(
    data: Entity_Membership,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const raw = EntityMembershipMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.entityMembership.create({
      data: raw,
    });
  }

  async find_list_entity_id(entity_id: string): Promise<Entity_Membership[]> {
    const list_entity_membership = await this.prisma
      .getPrismaClient()
      .entityMembership.findMany({
        where: {
          entity_id: entity_id,
        },
      });
    return list_entity_membership.map((item) =>
      EntityMembershipMapper.toDomain(item),
    );
  }
}
export { EntityMembershipRepository };
