import { Injectable } from '@nestjs/common';
import { Profile } from '../models/profile';
import { IProfileRepository } from './abstract_class/iprofile-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { ProfileMapper } from 'infra/database/mappers/ProfileMapper';

@Injectable()
class ProfileRepository implements IProfileRepository {
  constructor(private prisma: PrismaService) {}

  async update(data: Profile): Promise<void> {}

  async create(data: Profile): Promise<void> {
    const raw = ProfileMapper.toPrisma(data);
    await this.prisma.getPrismaClient().profile.create({
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
