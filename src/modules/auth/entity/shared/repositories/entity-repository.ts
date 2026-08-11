import { Injectable } from '@nestjs/common';
import { Entity } from '../models/entity';
import { DynamoDBEntityMapper } from '@modules/utils/mappers/dynamoDBEntityMapper';
import { IEntityRepository } from './abstract_class/ientity-repository';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { EntityMapper } from 'infra/database/mappers/EntityMapper';

@Injectable()
class EntityRepository implements IEntityRepository {
  constructor(private prisma: PrismaService) {}
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

  async create(data: Entity): Promise<void> {
    const raw = EntityMapper.toPrisma(data);
    await this.prisma.getPrismaClient().entity.create({
      data: raw,
    });
  }
}

export { EntityRepository };
