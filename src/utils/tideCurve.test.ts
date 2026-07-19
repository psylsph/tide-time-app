import {
  interpolateTideCurve,
  interpolateTideWindow,
  createTimeLabels,
  createRollingTimeLabels,
  tideEase,
  computeHeightDomain,
} from './tideCurve';
import type { TideEvent } from '../types/tide';

function event(type: 'high' | 'low', hour: number, height: number): TideEvent {
  const d = new Date(2026, 6, 11);
  d.setHours(hour, 0, 0, 0);
  return { type, time: d.toISOString(), height };
}

const FOUR_EVENTS: TideEvent[] = [
  event('high', 6, 6.0),
  event('low', 12, 1.0),
  event('high', 18, 5.5),
  event('low', 23, 0.8),
];

describe('tideEase', () => {
  it('is 0 at the start and 1 at the end', () => {
    expect(tideEase(0)).toBeCloseTo(0, 10);
    expect(tideEase(1)).toBeCloseTo(1, 10);
  });

  it('passes through 0.5 at the midpoint', () => {
    expect(tideEase(0.5)).toBeCloseTo(0.5, 10);
  });

  it('is strictly monotonic increasing on (0, 1)', () => {
    const steps = 20;
    let prev = tideEase(0);
    for (let i = 1; i <= steps; i++) {
      const v = tideEase(i / steps);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });

  it('stays within [0, 1] across the whole interval', () => {
    for (let i = 0; i <= 100; i++) {
      const v = tideEase(i / 100);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('interpolateTideCurve', () => {
  it('returns [] for fewer than two events', () => {
    expect(interpolateTideCurve([])).toEqual([]);
    expect(interpolateTideCurve([event('high', 6, 5)])).toEqual([]);
  });

  it('returns [] when the time range is non-positive (duplicate times)', () => {
    const same: TideEvent[] = [
      { type: 'high', time: event('high', 6, 5).time, height: 5 },
      { type: 'low', time: event('high', 6, 5).time, height: 1 },
    ];
    expect(interpolateTideCurve(same)).toEqual([]);
  });

  it('samples exactly numPoints across the events', () => {
    const points = interpolateTideCurve(FOUR_EVENTS, 50);
    expect(points).toHaveLength(50);
  });

  it('honours a custom numPoints value', () => {
    expect(interpolateTideCurve(FOUR_EVENTS, 11)).toHaveLength(11);
  });

  it('starts and ends exactly on the first and last events', () => {
    const points = interpolateTideCurve(FOUR_EVENTS, 50);
    const first = points[0];
    const last = points[49];
    expect(first.time.getTime()).toBe(new Date(FOUR_EVENTS[0].time).getTime());
    expect(last.time.getTime()).toBe(new Date(FOUR_EVENTS[3].time).getTime());
    expect(first.height).toBeCloseTo(FOUR_EVENTS[0].height, 6);
    expect(last.height).toBeCloseTo(FOUR_EVENTS[3].height, 6);
  });

  it('produces strictly increasing times', () => {
    const points = interpolateTideCurve(FOUR_EVENTS, 50);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].time.getTime()).toBeGreaterThan(points[i - 1].time.getTime());
    }
  });

  it('keeps every interpolated height within the global event min/max', () => {
    const points = interpolateTideCurve(FOUR_EVENTS, 80);
    const min = Math.min(...FOUR_EVENTS.map(e => e.height));
    const max = Math.max(...FOUR_EVENTS.map(e => e.height));
    const eps = 1e-9; // allow for floating-point rounding at segment boundaries
    for (const p of points) {
      expect(p.height).toBeGreaterThanOrEqual(min - eps);
      expect(p.height).toBeLessThanOrEqual(max + eps);
    }
  });

  it('orders events by time before interpolating (unsorted input)', () => {
    const unsorted = [FOUR_EVENTS[3], FOUR_EVENTS[1], FOUR_EVENTS[0], FOUR_EVENTS[2]];
    const sorted = interpolateTideCurve(unsorted, 50);
    const expected = interpolateTideCurve(FOUR_EVENTS, 50);
    expect(sorted[0].time.getTime()).toBe(expected[0].time.getTime());
    expect(sorted[49].time.getTime()).toBe(expected[49].time.getTime());
  });
});

describe('interpolateTideWindow', () => {
  it('always spans the requested rolling 24-hour window', () => {
    const center = new Date(2026, 6, 11, 12, 0, 0);
    const start = new Date(2026, 6, 11, 0, 0, 0);
    const end = new Date(2026, 6, 12, 0, 0, 0);
    const points = interpolateTideWindow(FOUR_EVENTS, start, end, 145);

    expect(points).toHaveLength(145);
    expect(points[0].time.getTime()).toBe(center.getTime() - 12 * 60 * 60 * 1000);
    expect(points[points.length - 1].time.getTime()).toBe(center.getTime() + 12 * 60 * 60 * 1000);
    expect(points.every(point => Number.isFinite(point.height))).toBe(true);
  });

  it('projects tide levels beyond the supplied final event', () => {
    const start = new Date(2026, 6, 11, 12, 0, 0);
    const end = new Date(2026, 6, 12, 12, 0, 0);
    const points = interpolateTideWindow(FOUR_EVENTS, start, end, 50);
    expect(points[points.length - 1].time.getTime()).toBe(end.getTime());
    expect(Number.isFinite(points[points.length - 1].height)).toBe(true);
  });
});

describe('createRollingTimeLabels', () => {
  it('creates 4-hour slots across a 24-hour window', () => {
    const start = new Date(2026, 6, 11, 1, 30, 0);
    const end = new Date(2026, 6, 12, 1, 30, 0);
    const labels = createRollingTimeLabels(start, end);
    expect(labels.map(label => label.label)).toEqual([
      '01:30', '05:30', '09:30', '13:30', '17:30', '21:30', '01:30',
    ]);
  });
});

describe('createTimeLabels', () => {
  const dayStart = new Date(2026, 6, 11, 0, 0, 0);

  it('labels a full day at 6h steps including a trailing 24:00', () => {
    const dayEnd = new Date(2026, 6, 12, 0, 0, 0); // exactly midnight == 24:00
    const labels = createTimeLabels(dayStart, dayEnd);
    expect(labels.map(l => l.label)).toEqual(['00:00', '06:00', '12:00', '18:00', '24:00']);
  });

  it('renders the final tick as "24:00", never a bare "00:00" duplicate', () => {
    const dayEnd = new Date(2026, 6, 12, 0, 0, 0);
    const labels = createTimeLabels(dayStart, dayEnd);
    expect(labels[labels.length - 1].label).toBe('24:00');
    expect(labels.filter(l => l.label === '00:00')).toHaveLength(1);
  });

  it('excludes ticks that fall outside the [start, end] window', () => {
    const midday = new Date(2026, 6, 11, 12, 0, 0);
    const labels = createTimeLabels(dayStart, midday);
    expect(labels.map(l => l.label)).toEqual(['00:00', '06:00', '12:00']);
  });

  it('respects a custom stepHours value', () => {
    const dayEnd = new Date(2026, 6, 12, 0, 0, 0);
    const labels = createTimeLabels(dayStart, dayEnd, 3);
    expect(labels[0].label).toBe('00:00');
    expect(labels[labels.length - 1].label).toBe('24:00');
    expect(labels.length).toBe(9);
  });

  it('produces labels whose times fall within the window', () => {
    const dayEnd = new Date(2026, 6, 11, 20, 0, 0);
    const labels = createTimeLabels(dayStart, dayEnd);
    for (const l of labels) {
      expect(l.time.getTime()).toBeGreaterThanOrEqual(dayStart.getTime());
      expect(l.time.getTime()).toBeLessThanOrEqual(dayEnd.getTime());
    }
  });
});

describe('computeHeightDomain', () => {
  it('returns [0, 1] for empty input', () => {
    expect(computeHeightDomain([])).toEqual([0, 1]);
  });

  it('allows the lower bound to go negative (low tides below sea level)', () => {
    // Regression: previously clamped at 0, clipping negative low tides off the
    // bottom of the chart and making the graph look broken.
    const [min] = computeHeightDomain([1.3, -1.4, 1.4, -1.5]);
    expect(min).toBeLessThan(0);
    expect(min).toBe(-2); // floor(-1.5 - 0.5)
  });

  it('pads by ~0.5 m and rounds to whole metres', () => {
    expect(computeHeightDomain([1.3, -1.4])).toEqual([-2, 2]);
    expect(computeHeightDomain([6.0, 1.0, 5.5, 0.8])).toEqual([0, 7]);
  });

  it('keeps a non-negative floor when all tides are above sea level', () => {
    const [min] = computeHeightDomain([0.8, 6.0]);
    expect(min).toBe(0); // floor(0.8 - 0.5) = floor(0.3) = 0
  });
});
