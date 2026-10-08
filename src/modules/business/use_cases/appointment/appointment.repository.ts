import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'infra/database/prisma/prisma.service';

export type AppointmentDb = Prisma.TransactionClient;

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  client(): PrismaClient {
    return this.prisma.getPrismaClient();
  }

  async transaction<T>(run: (tx: AppointmentDb) => Promise<T>): Promise<T> {
    try {
      return await this.client().$transaction(run, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15_000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2028'].includes(error.code)
      )
        throw new ConflictException(
          'Conflito de concorrência; consulte a disponibilidade e tente novamente',
        );
      throw error;
    }
  }

  async lockProfessionals(
    tx: AppointmentDb,
    entityId: string,
    profileIds: string[],
  ): Promise<void> {
    for (const profileId of [...new Set(profileIds)].sort()) {
      const rows = await tx.$queryRaw<Array<{ profile_id: string }>>`
        SELECT profile_id FROM "EntityMembership"
        WHERE entity_id = ${entityId}::uuid AND profile_id = ${profileId}::uuid
        FOR UPDATE`;
      if (rows.length !== 1)
        throw new NotFoundException('Profissional não encontrado no tenant');
    }
  }

  async lockAppointment(
    tx: AppointmentDb,
    entityId: string,
    id: string,
  ): Promise<void> {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Appointment" WHERE entity_id = ${entityId}::uuid AND id = ${id}::uuid FOR UPDATE`;
    if (rows.length !== 1)
      throw new NotFoundException('Appointment não encontrado');
  }
}
