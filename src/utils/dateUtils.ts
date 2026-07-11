import { addDays } from 'date-fns';

/** Earliest date the user can navigate to. */
export const MIN_TIDE_DATE = new Date(2020, 0, 1);

/** Latest date the user can navigate to. */
export const MAX_TIDE_DATE = new Date(2030, 11, 31);

/**
 * Move a date by `days` days, clamping to the allowed [min, max] window so the
 * user cannot navigate arbitrarily far into the past or future.
 */
export function changeDate(
  current: Date,
  days: number,
  min: Date = MIN_TIDE_DATE,
  max: Date = MAX_TIDE_DATE,
): Date {
  const next = addDays(current, days);
  if (next.getTime() < min.getTime()) return new Date(min);
  if (next.getTime() > max.getTime()) return new Date(max);
  return next;
}

/** Whether navigating by `days` would stay inside the allowed window. */
export function canChangeDate(
  current: Date,
  days: number,
  min: Date = MIN_TIDE_DATE,
  max: Date = MAX_TIDE_DATE,
): boolean {
  const next = addDays(current, days);
  return next.getTime() >= min.getTime() && next.getTime() <= max.getTime();
}
