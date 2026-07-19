import { formatTimeUntil, getTideStatus } from './tideStatus';
import type { TideEvent } from '../types/tide';

const EVENTS: TideEvent[] = [
  { type: 'high', time: '2026-06-10T00:00:00.000Z', height: 5 },
  { type: 'low', time: '2026-06-10T06:00:00.000Z', height: 1 },
  { type: 'high', time: '2026-06-10T12:00:00.000Z', height: 5 },
  { type: 'low', time: '2026-06-10T18:00:00.000Z', height: 1 },
];

describe('getTideStatus', () => {
  it('calculates the current level and an incoming tide', () => {
    const status = getTideStatus(EVENTS, new Date('2026-06-10T09:00:00.000Z'));

    expect(status).not.toBeNull();
    expect(status?.direction).toBe('in');
    expect(status?.height).toBeCloseTo(3);
    expect(status?.nextHigh.time).toBe('2026-06-10T12:00:00.000Z');
    expect(status?.nextLow.time).toBe('2026-06-10T18:00:00.000Z');
  });

  it('calculates an outgoing tide after high water', () => {
    const status = getTideStatus(EVENTS, new Date('2026-06-10T15:00:00.000Z'));
    expect(status?.direction).toBe('out');
    expect(status?.height).toBeCloseTo(3);
  });

  it('projects the next extrema after the final listed event', () => {
    const status = getTideStatus(EVENTS, new Date('2026-06-10T20:00:00.000Z'));
    expect(status?.direction).toBe('in');
    expect(status?.nextHigh).toBeDefined();
    expect(status?.nextLow).toBeDefined();
  });

  it('requires at least two events', () => {
    expect(getTideStatus(EVENTS.slice(0, 1), new Date('2026-06-10T09:00:00.000Z'))).toBeNull();
  });
});

describe('formatTimeUntil', () => {
  it('formats a compact hours and minutes countdown', () => {
    expect(
      formatTimeUntil('2026-06-10T12:20:00.000Z', new Date('2026-06-10T09:00:00.000Z')),
    ).toBe('3 hr 20 min');
  });
});
