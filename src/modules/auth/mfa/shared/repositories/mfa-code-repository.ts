import { Injectable } from '@nestjs/common';
import { IMFACodeRepository } from './abstract_class/imfa-code-repository';
import { MFA_Code } from '../models/mfa_code';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { MFACodeMapper } from 'infra/database/mappers/MFACodeMapper';

@Injectable()
class MFACodeRepository implements IMFACodeRepository {
  constructor(private prisma: PrismaService) {}
  async create(data: MFA_Code): Promise<void> {
    const raw = MFACodeMapper.toPrisma(data);
    await this.prisma.getPrismaClient().mfaCode.create({
      data: raw,
    });
  }

  async update_used(id: string): Promise<void> {
    await this.prisma.getPrismaClient().mfaCode.update({
      where: {
        id: id,
      },
      data: {
        used_at: true,
      },
    });
  }

  async update(data: MFA_Code): Promise<void> {
    const raw = MFACodeMapper.toPrisma(data);
    await this.prisma.getPrismaClient().mfaCode.update({
      where: {
        id: data.id,
      },
      data: raw,
    });
  }

  async find_one(
    identity_id: string,
    used: boolean,
    now: Date,
  ): Promise<MFA_Code | null> {
    const mfa_code = await this.prisma.getPrismaClient().mfaCode.findFirst({
      where: {
        identity_id: identity_id,
        used_at: used,
        expires_at: {
          gt: now,
        },
      },
    });
    if (!mfa_code) return null;
    return MFACodeMapper.toDomain(mfa_code);
  }
}
export { MFACodeRepository };
