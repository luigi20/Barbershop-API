import { Injectable } from '@nestjs/common';
import { Entity } from '../models/entity';
import { IEntityRepository } from './abstract_class/ientity-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { EntityMapper } from 'infra/database/mappers/EntityMapper';
import { Prisma } from '@prisma/client';
import { IdAndName } from '@modules/utils/types/types';

@Injectable()
class EntityRepository implements IEntityRepository {
  constructor(private prisma: PrismaService) {}
  async findByIdSelectIdAndName(id: string): Promise<IdAndName | null> {
    const entity = await this.prisma.getPrismaClient().entity.findFirst({
      where: {
        id: id,
      },
    });
    if (!entity) return null;
    return {
      id: entity.id,
      name: entity.name,
    };
  }
  async findByDocument(document: string): Promise<Entity | null> {
    const entity = await this.prisma.getPrismaClient().entity.findFirst({
      where: {
        document: document,
      },
    });
    if (!entity) return null;
    return EntityMapper.toDomain(entity);
  }

  async findByEmail(email: string): Promise<Entity | null> {
    const entity = await this.prisma.getPrismaClient().entity.findFirst({
      where: {
        email: email,
      },
    });
    if (!entity) return null;
    return EntityMapper.toDomain(entity);
  }

  async findById(id: string): Promise<Entity | null> {
    const entity = await this.prisma.getPrismaClient().entity.findFirst({
      where: {
        id: id,
      },
    });
    if (!entity) return null;
    return EntityMapper.toDomain(entity);
  }

  async list(): Promise<Entity[]> {
    const list_entity = await this.prisma.getPrismaClient().entity.findMany();
    return list_entity.map((item) => EntityMapper.toDomain(item));
  }

  async findByIdAndEmail(id: string, email: string): Promise<Entity | null> {
    const entity = await this.prisma.getPrismaClient().entity.findFirst({
      where: {
        id: id,
        email: email,
      },
    });
    if (!entity) return null;
    return EntityMapper.toDomain(entity);
  }

  async create(data: Entity, tx?: Prisma.TransactionClient): Promise<void> {
    const raw = EntityMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.entity.create({
      data: raw,
    });
  }
  async update(data: Entity): Promise<void> {
    const raw = EntityMapper.toPrisma(data);
    await this.prisma.getPrismaClient().entity.update({
      where: {
        id: data._id,
      },
      data: raw,
    });
  }
}

export { EntityRepository };
