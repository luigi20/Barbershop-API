import { Injectable } from '@nestjs/common';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { IIdentityCredentialRepository } from './abstract_class/iidentitycredential-repository';
import { Identity_Credential } from '../models/identity_credential';
import { IdentityCredentialMapper } from 'infra/database/mappers/IdentityCredentialMapper';

@Injectable()
class IdentityCredentialRepository implements IIdentityCredentialRepository {
  constructor(private prisma: PrismaService) {}
  async find_by_provider(
    provider: string,
    identity_id: string,
  ): Promise<Identity_Credential | null> {
    const identity_credential = await this.prisma
      .getPrismaClient()
      .identityCredential.findFirst({
        where: {
          identity_id: identity_id,
          provider: provider,
        },
      });
    if (!identity_credential) return null;
    return IdentityCredentialMapper.toDomain(identity_credential);
  }

  async find_by_identity_id(
    identity_id: string,
  ): Promise<Identity_Credential[]> {
    const identity_credential = await this.prisma
      .getPrismaClient()
      .identityCredential.findMany({
        where: {
          identity_id: identity_id,
        },
      });
    if (!identity_credential) return null;
    return identity_credential.map((item) =>
      IdentityCredentialMapper.toDomain(item),
    );
  }

  async find_by_id(id: string): Promise<Identity_Credential | null> {
    const identity_credential = await this.prisma
      .getPrismaClient()
      .identityCredential.findFirst({
        where: {
          id: id,
        },
      });
    if (!identity_credential) return null;
    return IdentityCredentialMapper.toDomain(identity_credential);
  }
  async create(
    data: Identity_Credential,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const raw = IdentityCredentialMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.identityCredential.create({
      data: raw,
    });
  }

  async update(
    data: Identity_Credential,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const raw = IdentityCredentialMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.identityCredential.update({
      data: raw,
    });
  }

  async update_password(identity_id: string, new_hash: string): Promise<void> {
    await this.prisma.getPrismaClient().identityCredential.update({
      where: {
        identity_id_provider: {
          identity_id,
          provider: 'local',
        },
      },
      data: {
        password_hash: new_hash,
      },
    });
  }
}

export { IdentityCredentialRepository };
