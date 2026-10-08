import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '@modules/utils/enum';
import {
  AvailabilityRepository,
  AvailabilityDb,
} from './availability.repository';
import { BlockDTO, HourPeriodDTO } from './availability.dto';
import {
  clock,
  contained,
  instant,
  Period,
  periods,
  validTimezone,
} from './availability.rules';

type StoredPeriod = Period & {
  id: string;
  entity_id: string;
  profile_id?: string;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly repo: AvailabilityRepository) {}

  private async entity(tx: AvailabilityDb, entityId: string) {
    const entity = await tx.entity.findUnique({ where: { id: entityId } });
    if (!entity) throw new NotFoundException('Empresa não encontrada');
    return entity;
  }

  private async configured(tx: AvailabilityDb, entityId: string) {
    const entity = await this.entity(tx, entityId);
    if (!entity.timezone)
      throw new BadRequestException(
        'Configure timezone da empresa antes dos horários',
      );
    return entity;
  }

  private async professional(
    tx: AvailabilityDb,
    entityId: string,
    profileId: string,
    requireBarber = true,
  ) {
    const member = await tx.entityMembership.findUnique({
      where: {
        entity_id_profile_id: { entity_id: entityId, profile_id: profileId },
      },
    });
    if (!member)
      throw new NotFoundException('Profissional não encontrado nesta empresa');
    if (
      requireBarber &&
      (member.status !== 'ativo' || !member.roles.includes(MemberRole.BARBEIRO))
    )
      throw new BadRequestException(
        'Membro precisa estar ativo e ter role barbeiro',
      );
    return member;
  }

  async getTimezone(entityId: string) {
    const entity = await this.entity(this.repo.client(), entityId);
    return { timezone: entity.timezone };
  }

  async setTimezone(entityId: string, timezone: string) {
    const zone = validTimezone(timezone);
    return this.repo.transaction(async (tx) => {
      if (!(await this.repo.lockEntity(tx, entityId)))
        throw new NotFoundException('Empresa não encontrada');
      const entity = await tx.entity.update({
        where: { id: entityId },
        data: { timezone: zone, updated_at: new Date() },
      });
      return { timezone: entity.timezone };
    });
  }

  private view(row: StoredPeriod) {
    return {
      id: row.id,
      entity_id: row.entity_id,
      ...(row.profile_id ? { profile_id: row.profile_id } : {}),
      weekday: row.weekday,
      start_time: clock(row.start_minute),
      end_time: clock(row.end_minute),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getBusiness(entityId: string) {
    await this.entity(this.repo.client(), entityId);
    const rows = await this.repo.client().entityBusinessHour.findMany({
      where: { entity_id: entityId },
      orderBy: [{ weekday: 'asc' }, { start_minute: 'asc' }],
    });
    return { periods: rows.map((row) => this.view(row)) };
  }

  async replaceBusiness(entityId: string, input: HourPeriodDTO[]) {
    const next = periods(input);
    return this.repo.transaction(async (tx) => {
      if (!(await this.repo.lockEntity(tx, entityId)))
        throw new NotFoundException('Empresa não encontrada');
      await this.configured(tx, entityId);
      const professional = await tx.professionalWorkingHour.findMany({
        where: { entity_id: entityId },
      });
      if (professional.some((p) => !contained(p, next)))
        throw new ConflictException(
          'Expediente excluiria jornada profissional',
        );
      const old = await tx.entityBusinessHour.findMany({
        where: { entity_id: entityId },
      });
      const key = (p: Period) =>
        `${p.weekday}:${p.start_minute}:${p.end_minute}`;
      const desired = new Set(next.map(key));
      await tx.entityBusinessHour.deleteMany({
        where: {
          entity_id: entityId,
          id: { in: old.filter((p) => !desired.has(key(p))).map((p) => p.id) },
        },
      });
      const existing = new Set(old.map(key));
      for (const p of next.filter((p) => !existing.has(key(p))))
        await tx.entityBusinessHour.create({
          data: { id: randomUUID(), entity_id: entityId, ...p },
        });
      const rows = await tx.entityBusinessHour.findMany({
        where: { entity_id: entityId },
        orderBy: [{ weekday: 'asc' }, { start_minute: 'asc' }],
      });
      return { periods: rows.map((row) => this.view(row)) };
    });
  }

  async getProfessional(entityId: string, profileId: string) {
    await this.professional(this.repo.client(), entityId, profileId, false);
    const rows = await this.repo.client().professionalWorkingHour.findMany({
      where: { entity_id: entityId, profile_id: profileId },
      orderBy: [{ weekday: 'asc' }, { start_minute: 'asc' }],
    });
    return {
      profile_id: profileId,
      periods: rows.map((row) => this.view(row)),
    };
  }

  async replaceProfessional(
    entityId: string,
    profileId: string,
    input: HourPeriodDTO[],
  ) {
    const next = periods(input);
    return this.repo.transaction(async (tx) => {
      if (!(await this.repo.lockEntity(tx, entityId)))
        throw new NotFoundException('Empresa não encontrada');
      await this.configured(tx, entityId);
      await this.professional(tx, entityId, profileId, next.length > 0);
      const business = await tx.entityBusinessHour.findMany({
        where: { entity_id: entityId },
        orderBy: [{ weekday: 'asc' }, { start_minute: 'asc' }],
      });
      if (next.some((p) => !contained(p, business)))
        throw new BadRequestException('Jornada fora do expediente da empresa');
      const old = await tx.professionalWorkingHour.findMany({
        where: { entity_id: entityId, profile_id: profileId },
      });
      const key = (p: Period) =>
        `${p.weekday}:${p.start_minute}:${p.end_minute}`;
      const desired = new Set(next.map(key));
      await tx.professionalWorkingHour.deleteMany({
        where: {
          entity_id: entityId,
          profile_id: profileId,
          id: { in: old.filter((p) => !desired.has(key(p))).map((p) => p.id) },
        },
      });
      const existing = new Set(old.map(key));
      for (const p of next.filter((p) => !existing.has(key(p))))
        await tx.professionalWorkingHour.create({
          data: {
            id: randomUUID(),
            entity_id: entityId,
            profile_id: profileId,
            ...p,
          },
        });
      const rows = await tx.professionalWorkingHour.findMany({
        where: { entity_id: entityId, profile_id: profileId },
        orderBy: [{ weekday: 'asc' }, { start_minute: 'asc' }],
      });
      return {
        profile_id: profileId,
        periods: rows.map((row) => this.view(row)),
      };
    });
  }

  private blockView(row: {
    id: string;
    entity_id: string;
    profile_id: string;
    starts_at: Date;
    ends_at: Date;
    reason: string | null;
    created_at: Date;
    updated_at: Date;
  }) {
    return {
      ...row,
      starts_at: row.starts_at.toISOString(),
      ends_at: row.ends_at.toISOString(),
    };
  }

  async listBlocks(
    entityId: string,
    profileId: string,
    from: string,
    to: string,
  ) {
    const start = instant(from),
      end = instant(to);
    if (start >= end)
      throw new BadRequestException('Período de consulta inválido');
    await this.professional(this.repo.client(), entityId, profileId, false);
    const rows = await this.repo.client().professionalTimeBlock.findMany({
      where: {
        entity_id: entityId,
        profile_id: profileId,
        starts_at: { lt: end },
        ends_at: { gt: start },
      },
      orderBy: { starts_at: 'asc' },
    });
    return rows.map((row) => this.blockView(row));
  }

  async createBlock(entityId: string, profileId: string, body: BlockDTO) {
    return this.writeBlock(entityId, profileId, null, body);
  }

  async updateBlock(
    entityId: string,
    profileId: string,
    id: string,
    body: BlockDTO,
  ) {
    return this.writeBlock(entityId, profileId, id, body);
  }

  private async writeBlock(
    entityId: string,
    profileId: string,
    id: string | null,
    body: BlockDTO,
  ) {
    const starts_at = instant(body.starts_at),
      ends_at = instant(body.ends_at);
    if (starts_at >= ends_at)
      throw new BadRequestException('Bloqueio requer início anterior ao fim');
    if (
      body.reason != null &&
      (typeof body.reason !== 'string' || body.reason.length > 500)
    )
      throw new BadRequestException('Motivo inválido');
    return this.repo.transaction(async (tx) => {
      if (!(await this.repo.lockEntity(tx, entityId)))
        throw new NotFoundException('Empresa não encontrada');
      await this.professional(tx, entityId, profileId);
      if (
        id &&
        !(await tx.professionalTimeBlock.findFirst({
          where: { id, entity_id: entityId, profile_id: profileId },
        }))
      )
        throw new NotFoundException('Bloqueio não encontrado');
      await this.configured(tx, entityId);
      const overlap = await tx.professionalTimeBlock.findFirst({
        where: {
          entity_id: entityId,
          profile_id: profileId,
          id: id ? { not: id } : undefined,
          starts_at: { lt: ends_at },
          ends_at: { gt: starts_at },
        },
      });
      if (overlap) throw new ConflictException('Bloqueios sobrepostos');
      const row = id
        ? await tx.professionalTimeBlock.update({
            where: { id },
            data: { starts_at, ends_at, reason: body.reason?.trim() || null },
          })
        : await tx.professionalTimeBlock.create({
            data: {
              id: randomUUID(),
              entity_id: entityId,
              profile_id: profileId,
              starts_at,
              ends_at,
              reason: body.reason?.trim() || null,
            },
          });
      return this.blockView(row);
    });
  }

  async removeBlock(entityId: string, profileId: string, id: string) {
    return this.repo.transaction(async (tx) => {
      if (!(await this.repo.lockEntity(tx, entityId)))
        throw new NotFoundException('Empresa não encontrada');
      const result = await tx.professionalTimeBlock.deleteMany({
        where: { id, entity_id: entityId, profile_id: profileId },
      });
      if (!result.count) throw new NotFoundException('Bloqueio não encontrado');
      return { id };
    });
  }
}
