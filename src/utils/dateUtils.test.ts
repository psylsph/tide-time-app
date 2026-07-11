import { changeDate, canChangeDate, MIN_TIDE_DATE, MAX_TIDE_DATE } from './dateUtils';

describe('changeDate', () => {
  it('advances by the given number of days', () => {
    const start = new Date(2026, 6, 11);
    const next = changeDate(start, 1);
    expect(next.getDate()).toBe(12);
  });

  it('goes backwards by the given number of days', () => {
    const start = new Date(2026, 6, 11);
    const prev = changeDate(start, -3);
    expect(prev.getDate()).toBe(8);
  });

  it('clamps to the minimum date rather than underflowing', () => {
    const start = new Date(2026, 6, 11);
    const result = changeDate(start, -100000);
    expect(result.getTime()).toBe(MIN_TIDE_DATE.getTime());
  });

  it('clamps to the maximum date rather than overflowing', () => {
    const start = new Date(2026, 6, 11);
    const result = changeDate(start, 100000);
    expect(result.getTime()).toBe(MAX_TIDE_DATE.getTime());
  });

  it('returns a new Date instance and does not mutate the input', () => {
    const start = new Date(2026, 6, 11);
    const startMs = start.getTime();
    changeDate(start, 5);
    expect(start.getTime()).toBe(startMs);
  });

  it('respects a custom min/max window', () => {
    const min = new Date(2026, 6, 10);
    const max = new Date(2026, 6, 12);
    expect(changeDate(new Date(2026, 6, 11), -5, min, max).getTime()).toBe(min.getTime());
    expect(changeDate(new Date(2026, 6, 11), 5, min, max).getTime()).toBe(max.getTime());
  });
});

describe('canChangeDate', () => {
  it('is true for a normal in-range move', () => {
    expect(canChangeDate(new Date(2026, 6, 11), 1)).toBe(true);
    expect(canChangeDate(new Date(2026, 6, 11), -1)).toBe(true);
  });

  it('is false when moving past the minimum', () => {
    expect(canChangeDate(MIN_TIDE_DATE, -1)).toBe(false);
  });

  it('is false when moving past the maximum', () => {
    expect(canChangeDate(MAX_TIDE_DATE, 1)).toBe(false);
  });

  it('is true when staying exactly on the boundary', () => {
    expect(canChangeDate(MAX_TIDE_DATE, 0)).toBe(true);
    expect(canChangeDate(MIN_TIDE_DATE, 0)).toBe(true);
  });
});
