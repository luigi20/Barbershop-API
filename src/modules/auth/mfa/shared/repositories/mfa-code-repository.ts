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
}
export { MFACodeRepository };
