import { BadRequestException, ConflictException } from '@nestjs/common';
import { HourPeriodDTO } from './availability.dto';

export type Period = {
  weekday: number;
  start_minute: number;
  end_minute: number;
};

export function validTimezone(value: string): string {
  if (
    typeof value !== 'string' ||
    value.length > 100 ||
    !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$|^UTC$/.test(value)
  )
    throw new BadRequestException('Timezone IANA inválido');
  try {
    const canonical = new Intl.DateTimeFormat('en-US', {
      timeZone: value,
    }).resolvedOptions().timeZone;
    if (!canonical) throw new Error('unknown timezone');
    return canonical;
  } catch {
    throw new BadRequestException('Timezone IANA não suportado');
  }
}

export function minute(value: string, end = false): number {
  if (
    typeof value !== 'string' ||
    !(/^([01]\d|2[0-3]):[0-5]\d$/.test(value) || (end && value === '24:00'))
  )
    throw new BadRequestException('Horário deve ser HH:mm');
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function clock(value: number): string {
  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}

export function periods(input: HourPeriodDTO[]): Period[] {
  if (!Array.isArray(input))
    throw new BadRequestException('periods deve ser array');
  const result = input
    .map((p) => {
      if (!p || !Number.isInteger(p.weekday) || p.weekday < 0 || p.weekday > 6)
        throw new BadRequestException('Weekday inválido');
      const start_minute = minute(p.start_time);
      const end_minute = minute(p.end_time, true);
      if (start_minute >= end_minute)
        throw new BadRequestException(
          'Início deve anteceder fim; divida turnos que cruzam meia-noite',
        );
      return { weekday: p.weekday, start_minute, end_minute };
    })
    .sort((a, b) => a.weekday - b.weekday || a.start_minute - b.start_minute);
  for (let i = 1; i < result.length; i++) {
    if (
      result[i].weekday === result[i - 1].weekday &&
      result[i].start_minute < result[i - 1].end_minute
    )
      throw new ConflictException('Períodos sobrepostos');
  }
  return result;
}

export function contained(inner: Period, outer: Period[]): boolean {
  // A professional period may span adjacent business periods, but never a gap.
  let cursor = inner.start_minute;
  for (const p of outer.filter((x) => x.weekday === inner.weekday)) {
    if (p.end_minute <= cursor) continue;
    if (p.start_minute > cursor) return false;
    cursor = Math.max(cursor, p.end_minute);
    if (cursor >= inner.end_minute) return true;
  }
  return false;
}

export function instant(value: string): Date {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(
      value,
    )
  )
    throw new BadRequestException('Instante ISO 8601 requer Z ou offset');
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() + 1 !== month ||
    calendar.getUTCDate() !== day
  )
    throw new BadRequestException('Data inválida');
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()))
    throw new BadRequestException('Data inválida');
  return date;
}
