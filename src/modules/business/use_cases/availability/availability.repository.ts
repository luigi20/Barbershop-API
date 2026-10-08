import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'infra/database/prisma/prisma.service';

export type AvailabilityDb = Prisma.TransactionClient;

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  client(): PrismaClient {
    return this.prisma.getPrismaClient();
  }

  transaction<T>(run: (tx: AvailabilityDb) => Promise<T>): Promise<T> {
    return this.client().$transaction(run, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async lockEntity(tx: AvailabilityDb, entityId: string): Promise<boolean> {
    const rows = await tx.$queryRaw<
      Array<{ id: string }>
    >`SELECT id FROM "Entity" WHERE id = ${entityId}::uuid FOR UPDATE`;
    return rows.length === 1;
  }
}
