import { Injectable } from '@nestjs/common';
import { IRefreshTokensRepository } from './abstract_class/irefresh-tokens-repository';
import { Refresh_Tokens } from '../models/refresh-tokens';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { RefreshTokensMapper } from 'infra/database/mappers/RefreshTokensMapper';

@Injectable()
class RefreshTokensRepository implements IRefreshTokensRepository {
  constructor(private prisma: PrismaService) {}
  async find_session(id: string): Promise<Refresh_Tokens | null> {
    const row = await this.prisma
      .getPrismaClient()
      .refreshToken.findUnique({ where: { id } });
    return row ? RefreshTokensMapper.toDomain(row) : null;
  }

  async rotate(
    id: string,
    previousHash: string,
    nextHash: string,
    now: Date,
  ): Promise<boolean> {
    // Compare-and-swap: only one concurrent request may consume the current token.
    const result = await this.prisma.getPrismaClient().refreshToken.updateMany({
      where: {
        id,
        token_hash: previousHash,
        revoked_at: false,
        expires_at: { gt: now },
      },
      data: { token_hash: nextHash, updated_at: now },
    });
    return result.count === 1;
  }

  async revoke_session(id: string, identity_id: string): Promise<boolean> {
    const result = await this.prisma.getPrismaClient().refreshToken.updateMany({
      where: { id, identity_id },
      data: { revoked_at: true, updated_at: new Date() },
    });
    return result.count === 1;
  }

  async create(data: Refresh_Tokens): Promise<void> {
    const raw = RefreshTokensMapper.toPrisma(data);
    await this.prisma.getPrismaClient().refreshToken.create({
      data: raw,
    });
  }

  async find_by_hash(token_hash: string): Promise<string | null> {
    const refresh_hash = await this.prisma
      .getPrismaClient()
      .refreshToken.findFirst({
        where: {
          token_hash: token_hash,
        },
        select: {
          id: true,
        },
      });
    if (!refresh_hash) return null;
    return refresh_hash.id;
  }

  async find_one(
    identity_id: string,
    revoked: boolean,
    now: Date,
  ): Promise<Refresh_Tokens | null> {
    const refresh_hash = await this.prisma
      .getPrismaClient()
      .refreshToken.findFirst({
        where: {
          identity_id: identity_id,
          revoked_at: revoked,
          expires_at: {
            gt: now,
          },
        },
      });
    if (!refresh_hash) return null;
    return RefreshTokensMapper.toDomain(refresh_hash);
  }

  async update_revoked(id: string): Promise<void> {
    await this.prisma.getPrismaClient().refreshToken.update({
      where: {
        id: id,
      },
      data: {
        revoked_at: true,
      },
    });
  }
}

export { RefreshTokensRepository };
