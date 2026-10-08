import { BadRequestException } from '@nestjs/common';
import { Period } from '../availability/availability.rules';

export const SLOT_INTERVAL_MINUTES = 15;
const MINUTE_MS = 60_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

export function localDateInput(value: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new BadRequestException('date deve ser YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value)
    throw new BadRequestException('Data local inválida');
  return value;
}

export function localParts(instant: Date, timezone: string) {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timezone, formatter);
  }
  const parts = formatter.formatToParts(instant);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const year = value('year'),
    month = value('month'),
    day = value('day');
  return {
    year,
    month,
    day,
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
    date: `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

function offsetAt(instant: Date, timezone: string): number {
  const p = localParts(instant, timezone);
  return (
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) -
    Math.floor(instant.valueOf() / 1000) * 1000
  );
}

export function localCandidates(
  date: string,
  minute: number,
  timezone: string,
): Date[] {
  localDateInput(date);
  const base = Date.parse(`${date}T00:00:00.000Z`) + minute * MINUTE_MS;
  const wanted = new Date(base);
  const offsets = new Set(
    [-86_400_000, 0, 86_400_000].map((delta) =>
      offsetAt(new Date(base + delta), timezone),
    ),
  );
  const result: Date[] = [];
  for (const offset of offsets) {
    const candidate = new Date(base - offset);
    const p = localParts(candidate, timezone);
    if (
      p.year === wanted.getUTCFullYear() &&
      p.month === wanted.getUTCMonth() + 1 &&
      p.day === wanted.getUTCDate() &&
      p.hour === wanted.getUTCHours() &&
      p.minute === wanted.getUTCMinutes()
    )
      result.push(candidate);
  }
  return result.sort((a, b) => a.valueOf() - b.valueOf());
}

export function fitsWeekly(
  start: Date,
  end: Date,
  timezone: string,
  business: Period[],
  professional: Period[],
): boolean {
  const allowed = (instant: Date) => {
    const p = localParts(instant, timezone);
    const minute = p.hour * 60 + p.minute;
    return (
      business.some(
        (h) =>
          h.weekday === p.weekday &&
          h.start_minute <= minute &&
          minute < h.end_minute,
      ) &&
      professional.some(
        (h) =>
          h.weekday === p.weekday &&
          h.start_minute <= minute &&
          minute < h.end_minute,
      )
    );
  };
  for (let time = start.valueOf(); time < end.valueOf(); time += MINUTE_MS)
    if (!allowed(new Date(time))) return false;
  return allowed(new Date(end.valueOf() - 1));
}
