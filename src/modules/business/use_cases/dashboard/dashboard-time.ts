import { BadRequestException } from '@nestjs/common';
import {
  localCandidates,
  localDateInput,
  localParts,
} from '../appointment/appointment-time';

export function nextDate(date: string): string {
  localDateInput(date);
  const next = new Date(Date.parse(`${date}T00:00:00.000Z`) + 86_400_000);
  return next.toISOString().slice(0, 10);
}

export function dayStart(date: string, timezone: string): Date {
  localDateInput(date);
  for (let minute = 0; minute < 1440; minute++) {
    const candidate = localCandidates(date, minute, timezone)[0];
    if (candidate) return candidate;
  }
  throw new BadRequestException('Dia local inexistente neste timezone');
}

export function dayRange(date: string, timezone: string) {
  return {
    start: dayStart(date, timezone),
    end: dayStart(nextDate(date), timezone),
  };
}

export function todayIn(timezone: string, now: Date): string {
  return localParts(now, timezone).date;
}

export function datesInRange(from: string, to: string): string[] {
  localDateInput(from);
  localDateInput(to);
  const dates: string[] = [];
  for (let date = from; date <= to && dates.length <= 90; date = nextDate(date))
    dates.push(date);
  if (!dates.length || dates.length > 90)
    throw new BadRequestException('Intervalo deve ter de 1 a 90 dias locais');
  return dates;
}
