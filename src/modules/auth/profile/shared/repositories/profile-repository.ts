import { Injectable } from '@nestjs/common';
import { Profile } from '../models/profile';
import { IProfileRepository } from './abstract_class/iprofile-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { ProfileMapper } from 'infra/database/mappers/ProfileMapper';
import { Prisma } from '@prisma/client';

@Injectable()
class ProfileRepository implements IProfileRepository {
  constructor(private prisma: PrismaService) {}

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
