import { Injectable } from '@nestjs/common';
import { Profile } from '../models/profile';
import { IProfileRepository } from './abstract_class/iprofile-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { ProfileMapper } from 'infra/database/mappers/ProfileMapper';
import { Prisma } from '@prisma/client';
import { IdAndName } from '@modules/utils/types/types';

@Injectable()
class ProfileRepository implements IProfileRepository {
  constructor(private prisma: PrismaService) {}

  async findByIdSelectIdAndName(id: string): Promise<IdAndName | null> {
    const profile = await this.prisma.getPrismaClient().profile.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
      },
    });
    if (!profile) return null;
    return {
      id: profile.id,
      name: profile.name,
    };
  }

  async update(data: Profile): Promise<void> {
    const raw = ProfileMapper.toPrisma(data);
    await this.prisma.getPrismaClient().profile.update({
      where: {
        id: data.id,
      },
      data: raw,
    });
  }

  async create(data: Profile, tx?: Prisma.TransactionClient): Promise<void> {
    const raw = ProfileMapper.toPrisma(data);
    const client = tx ?? this.prisma;
    await client.profile.create({
      data: raw,
    });
  }

  async find_one(id: string): Promise<Profile | null> {
    const profile = await this.prisma.getPrismaClient().profile.findFirst({
      where: {
        id: id,
      },
    });
    if (!profile) return null;
    return ProfileMapper.toDomain(profile);
  }

  async find_identity_id(identity_id: string): Promise<Profile | null> {
    const profile = await this.prisma.getPrismaClient().profile.findFirst({
      where: {
        identity_id: identity_id,
      },
    });
    if (!profile) return null;
    return ProfileMapper.toDomain(profile);
  }
}
export { ProfileRepository };
