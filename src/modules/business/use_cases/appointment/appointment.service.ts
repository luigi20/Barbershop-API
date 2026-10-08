import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Appointment } from '@prisma/client';
import { MemberRole, AppointmentStatus } from '@modules/utils/enum';
import { instant, Period } from '../availability/availability.rules';
import { AppointmentRepository, AppointmentDb } from './appointment.repository';
import { AppointmentMapper } from './appointment.mapper';
import {
  fitsWeekly,
  localCandidates,
  localDateInput,
  localParts,
  SLOT_INTERVAL_MINUTES,
} from './appointment-time';
import {
  CancelAppointmentDTO,
  CreateAppointmentDTO,
  RescheduleAppointmentDTO,
} from './appointment.dto';

type Actor = { entity_id: string; profile_id: string; roles: MemberRole[] };
type Interval = { starts_at: Date; ends_at: Date };
const BLOCKING = [AppointmentStatus.AGENDADO, AppointmentStatus.CONCLUIDO];

@Injectable()
export class AppointmentService {
  constructor(private readonly repo: AppointmentRepository) {}

  private validId(value: string): string {
    if (!isUUID(value)) throw new BadRequestException('UUID inválido');
    return value;
  }

  private async entity(tx: AppointmentDb, entityId: string) {
    const row = await tx.entity.findUnique({
      where: { id: entityId },
      select: { id: true, timezone: true },
    });
    if (!row) throw new NotFoundException('Empresa não encontrada');
    if (!row.timezone)
      throw new BadRequestException('Configure timezone da empresa');
    return row;
  }

  private async professional(
    tx: AppointmentDb,
    entityId: string,
    profileId: string,
  ) {
    const row = await tx.entityMembership.findUnique({
      where: {
        entity_id_profile_id: { entity_id: entityId, profile_id: profileId },
      },
    });
    if (!row)
      throw new NotFoundException('Profissional não encontrado no tenant');
    if (row.status !== 'ativo' || !row.roles.includes(MemberRole.BARBEIRO))
      throw new BadRequestException('Profissional deve ser barbeiro ativo');
    return row;
  }

  private async customer(
    tx: AppointmentDb,
    entityId: string,
    customerId: string,
  ) {
    const row = await tx.entityCustomer.findUnique({
      where: {
        customer_id_entity_id: { customer_id: customerId, entity_id: entityId },
      },
    });
    if (!row) throw new NotFoundException('Customer não encontrado no tenant');
    if (row.status !== 'ativo')
      throw new BadRequestException('Customer inativo');
    return row;
  }

  private async service(
    tx: AppointmentDb,
    entityId: string,
    serviceId: string,
  ) {
    const row = await tx.service.findFirst({
      where: { id: serviceId, entity_id: entityId },
    });
    if (!row) throw new NotFoundException('Service não encontrado no tenant');
    if (row.status !== 'ativo')
      throw new BadRequestException('Service inativo');
    return row;
  }

  private async rules(tx: AppointmentDb, entityId: string, profileId: string) {
    const business = await tx.entityBusinessHour.findMany({
      where: { entity_id: entityId },
    });
    const professional = await tx.professionalWorkingHour.findMany({
      where: { entity_id: entityId, profile_id: profileId },
    });
    return {
      business: business as Period[],
      professional: professional as Period[],
    };
  }

  private async occupied(
    tx: AppointmentDb,
    entityId: string,
    profileId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ) {
    const block = await tx.professionalTimeBlock.findFirst({
      where: {
        entity_id: entityId,
        profile_id: profileId,
        starts_at: { lt: end },
        ends_at: { gt: start },
      },
      select: { id: true },
    });
    const appointment = await tx.appointment.findFirst({
      where: {
        entity_id: entityId,
        professional_profile_id: profileId,
        status: { in: BLOCKING },
        id: excludeId ? { not: excludeId } : undefined,
        starts_at: { lt: end },
        ends_at: { gt: start },
      },
      select: { id: true },
    });
    return Boolean(block || appointment);
  }

  private async ensureSlot(
    tx: AppointmentDb,
    entityId: string,
    profileId: string,
    timezone: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ) {
    const { business, professional } = await this.rules(
      tx,
      entityId,
      profileId,
    );
    if (!fitsWeekly(start, end, timezone, business, professional))
      throw new ConflictException('Horário fora do expediente ou jornada');
    if (await this.occupied(tx, entityId, profileId, start, end, excludeId))
      throw new ConflictException('Horário indisponível');
  }

  private note(value: string | null | undefined, max: number): string | null {
    if (value == null) return null;
    if (typeof value !== 'string' || value.length > max)
      throw new BadRequestException('Texto inválido');
    return value.trim() || null;
  }

  private future(start: Date) {
    if (start.valueOf() <= Date.now())
      throw new BadRequestException('Horário deve ser futuro');
  }

  private canRead(actor: Actor, profileId: string) {
    if (
      actor.roles?.includes(MemberRole.ADMINISTRADOR) ||
      actor.roles?.includes(MemberRole.RECEPCIONISTA)
    )
      return;
    if (
      !actor.roles?.includes(MemberRole.BARBEIRO) ||
      actor.profile_id !== profileId
    )
      throw new ForbiddenException(
        'Barbeiro pode consultar apenas a própria agenda',
      );
  }

  private async mapRows(tx: AppointmentDb, rows: Appointment[]) {
    if (!rows.length) return [];
    const customers = await tx.customer.findMany({
      where: { id: { in: [...new Set(rows.map((r) => r.customer_id))] } },
      select: { id: true, profile_id: true },
    });
    const profileIds = [
      ...new Set([
        ...rows.map((r) => r.professional_profile_id),
        ...customers
          .map((c) => c.profile_id)
          .filter((id): id is string => Boolean(id)),
      ]),
    ];
    const profiles = await tx.profile.findMany({
      where: { id: { in: profileIds } },
      select: { id: true, name: true },
    });
    const names = new Map(profiles.map((p) => [p.id, p.name]));
    const customerProfiles = new Map(
      customers.map((c) => [c.id, c.profile_id]),
    );
    return rows.map((row) =>
      AppointmentMapper.toHttp(
        row,
        names.get(customerProfiles.get(row.customer_id) ?? '') ?? null,
        names.get(row.professional_profile_id) ?? null,
      ),
    );
  }

  async availability(
    actor: Actor,
    dateValue: string,
    profileId: string,
    serviceId: string,
  ) {
    const date = localDateInput(dateValue);
    this.validId(profileId);
    this.validId(serviceId);
    this.canRead(actor, profileId);
    const tx = this.repo.client();
    const entity = await this.entity(tx, actor.entity_id);
    await this.professional(tx, actor.entity_id, profileId);
    const service = await this.service(tx, actor.entity_id, serviceId);
    const { business, professional } = await this.rules(
      tx,
      actor.entity_id,
      profileId,
    );
    const near = new Date(`${date}T00:00:00.000Z`);
    const from = new Date(near.valueOf() - 2 * 86_400_000);
    const to = new Date(near.valueOf() + 3 * 86_400_000);
    const blocks = await tx.professionalTimeBlock.findMany({
      where: {
        entity_id: actor.entity_id,
        profile_id: profileId,
        starts_at: { lt: to },
        ends_at: { gt: from },
      },
    });
    const appointments = await tx.appointment.findMany({
      where: {
        entity_id: actor.entity_id,
        professional_profile_id: profileId,
        status: { in: BLOCKING },
        starts_at: { lt: to },
        ends_at: { gt: from },
      },
    });
    const occupied: Interval[] = [...blocks, ...appointments];
    const weekday = near.getUTCDay();
    const slots: { starts_at: string; ends_at: string }[] = [];
    const seen = new Set<number>();
    for (const period of professional.filter((p) => p.weekday === weekday)) {
      for (
        let minute = period.start_minute;
        minute < period.end_minute;
        minute += SLOT_INTERVAL_MINUTES
      ) {
        for (const start of localCandidates(date, minute, entity.timezone)) {
          if (start.valueOf() <= Date.now() || seen.has(start.valueOf()))
            continue;
          const end = new Date(
            start.valueOf() + service.duration_minutes * 60_000,
          );
          if (
            localParts(start, entity.timezone).date !== date ||
            !fitsWeekly(start, end, entity.timezone, business, professional)
          )
            continue;
          if (occupied.some((p) => p.starts_at < end && p.ends_at > start))
            continue;
          seen.add(start.valueOf());
          slots.push({
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
          });
        }
      }
    }
    slots.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return {
      date,
      timezone: entity.timezone,
      professional_profile_id: profileId,
      service_id: serviceId,
      duration_minutes: service.duration_minutes,
      slot_interval_minutes: SLOT_INTERVAL_MINUTES,
      slots,
    };
  }

  async create(actor: Actor, body: CreateAppointmentDTO) {
    this.validId(body.customer_id);
    this.validId(body.professional_profile_id);
    this.validId(body.service_id);
    const start = instant(body.starts_at);
    this.future(start);
    const notes = this.note(body.notes, 1000);
    return this.repo.transaction(async (tx) => {
      await this.repo.lockProfessionals(tx, actor.entity_id, [
        body.professional_profile_id,
      ]);
      const entity = await this.entity(tx, actor.entity_id);
      await this.professional(
        tx,
        actor.entity_id,
        body.professional_profile_id,
      );
      await this.customer(tx, actor.entity_id, body.customer_id);
      const service = await this.service(tx, actor.entity_id, body.service_id);
      const end = new Date(start.valueOf() + service.duration_minutes * 60_000);
      await this.ensureSlot(
        tx,
        actor.entity_id,
        body.professional_profile_id,
        entity.timezone,
        start,
        end,
      );
      const row = await tx.appointment.create({
        data: {
          id: randomUUID(),
          entity_id: actor.entity_id,
          customer_id: body.customer_id,
          professional_profile_id: body.professional_profile_id,
          service_id: body.service_id,
          service_name_snapshot: service.name,
          price_snapshot: service.price,
          duration_minutes_snapshot: service.duration_minutes,
          starts_at: start,
          ends_at: end,
          status: AppointmentStatus.AGENDADO,
          notes,
        },
      });
      return (await this.mapRows(tx, [row]))[0];
    });
  }

  async list(
    actor: Actor,
    fromValue: string,
    toValue: string,
    profileId?: string,
    customerId?: string,
    status?: string,
  ) {
    const from = instant(fromValue),
      to = instant(toValue);
    if (from >= to || to.valueOf() - from.valueOf() > 31 * 86_400_000)
      throw new BadRequestException(
        'Intervalo deve ser positivo e ter até 31 dias',
      );
    if (profileId) this.validId(profileId);
    if (customerId) this.validId(customerId);
    if (
      status &&
      !Object.values(AppointmentStatus).includes(status as AppointmentStatus)
    )
      throw new BadRequestException('Status inválido');
    if (
      actor.roles?.includes(MemberRole.BARBEIRO) &&
      !actor.roles.includes(MemberRole.ADMINISTRADOR) &&
      !actor.roles.includes(MemberRole.RECEPCIONISTA)
    ) {
      if (!actor.profile_id || !isUUID(actor.profile_id))
        throw new ForbiddenException('Contexto do barbeiro obrigatório');
      if (profileId && profileId !== actor.profile_id)
        throw new ForbiddenException(
          'Barbeiro pode consultar apenas a própria agenda',
        );
      profileId = actor.profile_id;
    }
    const rows = await this.repo.client().appointment.findMany({
      where: {
        entity_id: actor.entity_id,
        professional_profile_id: profileId,
        customer_id: customerId,
        status,
        starts_at: { lt: to },
        ends_at: { gt: from },
      },
      orderBy: { starts_at: 'asc' },
    });
    return this.mapRows(this.repo.client(), rows);
  }

  async detail(actor: Actor, id: string) {
    this.validId(id);
    const row = await this.repo
      .client()
      .appointment.findFirst({ where: { id, entity_id: actor.entity_id } });
    if (!row) throw new NotFoundException('Appointment não encontrado');
    this.canRead(actor, row.professional_profile_id);
    return (await this.mapRows(this.repo.client(), [row]))[0];
  }

  async reschedule(actor: Actor, id: string, body: RescheduleAppointmentDTO) {
    this.validId(id);
    const start = instant(body.starts_at);
    this.future(start);
    if (body.professional_profile_id)
      this.validId(body.professional_profile_id);
    return this.repo.transaction(async (tx) => {
      await this.repo.lockAppointment(tx, actor.entity_id, id);
      const existing = await tx.appointment.findFirst({
        where: { id, entity_id: actor.entity_id },
      });
      if (!existing) throw new NotFoundException('Appointment não encontrado');
      if (existing.status !== 'agendado')
        throw new ConflictException('Estado terminal não pode ser reagendado');
      const profileId =
        body.professional_profile_id ?? existing.professional_profile_id;
      await this.repo.lockProfessionals(tx, actor.entity_id, [
        existing.professional_profile_id,
        profileId,
      ]);
      const entity = await this.entity(tx, actor.entity_id);
      await this.professional(tx, actor.entity_id, profileId);
      const end = new Date(
        start.valueOf() + existing.duration_minutes_snapshot * 60_000,
      );
      await this.ensureSlot(
        tx,
        actor.entity_id,
        profileId,
        entity.timezone,
        start,
        end,
        id,
      );
      const row = await tx.appointment.update({
        where: { id },
        data: {
          professional_profile_id: profileId,
          starts_at: start,
          ends_at: end,
        },
      });
      return (await this.mapRows(tx, [row]))[0];
    });
  }

  async cancel(actor: Actor, id: string, body: CancelAppointmentDTO = {}) {
    this.validId(id);
    const reason = this.note(body.reason, 500);
    return this.repo.transaction(async (tx) => {
      await this.repo.lockAppointment(tx, actor.entity_id, id);
      const existing = await tx.appointment.findFirst({
        where: { id, entity_id: actor.entity_id },
      });
      if (!existing) throw new NotFoundException('Appointment não encontrado');
      if (existing.status === 'cancelado')
        return (await this.mapRows(tx, [existing]))[0];
      if (existing.status !== 'agendado')
        throw new ConflictException(
          'Appointment concluído não pode ser cancelado',
        );
      const row = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CANCELADO,
          cancellation_reason: reason,
          cancelled_at: new Date(),
        },
      });
      return (await this.mapRows(tx, [row]))[0];
    });
  }

  async complete(actor: Actor, id: string) {
    this.validId(id);
    return this.repo.transaction(async (tx) => {
      await this.repo.lockAppointment(tx, actor.entity_id, id);
      const existing = await tx.appointment.findFirst({
        where: { id, entity_id: actor.entity_id },
      });
      if (!existing) throw new NotFoundException('Appointment não encontrado');
      if (existing.status !== 'agendado')
        throw new ConflictException(
          'Apenas Appointment agendado pode ser concluído',
        );
      const row = await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CONCLUIDO, completed_at: new Date() },
      });
      return (await this.mapRows(tx, [row]))[0];
    });
  }
}
