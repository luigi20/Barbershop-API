import { Injectable } from '@nestjs/common';
import { IIdentityRepository } from './abstract_class/iidentity-repository';
import { Identity } from '../models/identity';

import { PrismaService } from 'infra/database/prisma/prisma.service';
import { IdentityMapper } from 'infra/database/mappers/IdentityMapper';
import { Prisma } from '@prisma/client';

@Injectable()
class IdentityRepository implements IIdentityRepository {
  constructor(private prisma: PrismaService) {}
  async update_last_login_at(
    identity_id: string,
    last_login_at: Date,
  ): Promise<void> {
    await this.prisma.getPrismaClient().identity.update({
      where: {
        id: identity_id,
      },
      data: {
        last_login_at: last_login_at,
      },
    });
  }
  async find_by_email(email: string): Promise<Identity | null> {
    const identity = await this.prisma.getPrismaClient().identity.findUnique({
      where: {
        email: email,
      },
    });
    if (!identity) return null;
    return IdentityMapper.toDomain(identity);
  }

  async find_by_id(id: string): Promise<Identity | null> {
    const identity = await this.prisma.getPrismaClient().identity.findUnique({
      where: {
        id: id,
      },
    });
    if (!identity) return null;
    return IdentityMapper.toDomain(identity);
  }
  async create(data: Identity, tx?: Prisma.TransactionClient): Promise<void> {
    const raw = IdentityMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.identity.create({
      data: raw,
    });
  }

  async update(data: Identity, tx?: Prisma.TransactionClient): Promise<void> {
    const raw = IdentityMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.identity.update({
      data: raw,
    });
  }

  async update_password(identity_id: string, new_hash: string): Promise<void> {
    await this.prisma.getPrismaClient().identity.update({
      where: {
        id: identity_id,
      },
      data: {
        password_hash: new_hash,
      },
    });
  }

  async set_update_mfa_required(
    identity_id: string,
    mfa_required: boolean,
  ): Promise<void> {
    await this.prisma.getPrismaClient().identity.update({
      where: {
        id: identity_id,
      },
      data: {
        mfa_required: mfa_required,
      },
    });
  }
}

export { IdentityRepository };
