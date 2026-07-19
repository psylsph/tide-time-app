import { addHours, format, parseISO, startOfDay } from 'date-fns';
import type { TideEvent } from '../types/tide';
import { DEFAULT_CURVE_POINTS } from '../config/layout';

/** A sampled point on the interpolated tide curve. */
export interface CurvePoint {
  time: Date;
  height: number;
}

/** A labelled tick on the graph's time axis. */
export interface TimeLabel {
  hour: number;
  time: Date;
  label: string;
}

interface ParsedTideEvent {
  type: TideEvent['type'];
  time: Date;
  height: number;
}

/**
 * Ease a fraction (0..1) between two tide events using a half-sine so the curve
 * flattens near high/low water and is steepest mid-between them — i.e. it looks
 * like a real tide curve rather than a piecewise-linear zig-zag.
 *
 * Exported for unit testing.
 */
export function tideEase(fraction: number): number {
  return Math.sin((fraction - 0.5) * Math.PI) * 0.5 + 0.5;
}

/**
 * Sample `numPoints` evenly spaced points across the tide events, interpolating
 * height with `tideEase`. Returns `[]` if there are fewer than two events or the
 * time range is non-positive (the graph renders an empty-state placeholder then).
 */
export function interpolateTideCurve(
  events: TideEvent[],
  numPoints: number = DEFAULT_CURVE_POINTS,
): CurvePoint[] {
  const sorted = [...events]
    .map(e => ({ ...e, time: parseISO(e.time) }))
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  if (sorted.length < 2) return [];

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const range = last.time.getTime() - first.time.getTime();
  if (range <= 0) return [];

  const step = range / (numPoints - 1);
  const points: CurvePoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = new Date(first.time.getTime() + i * step);
    let height = sorted[0].height;

    for (let j = 0; j < sorted.length - 1; j++) {
      const p1 = sorted[j];
      const p2 = sorted[j + 1];
      if (t.getTime() >= p1.time.getTime() && t.getTime() <= p2.time.getTime()) {
        const frac =
          (t.getTime() - p1.time.getTime()) / (p2.time.getTime() - p1.time.getTime());
        height = p1.height + (p2.height - p1.height) * tideEase(frac);
        break;
      }
    }

    points.push({ time: t, height });
  }

  return points;
}

/**
 * Build an interpolated curve for an exact time window. When the supplied
 * calendar-day events do not cover a boundary, adjacent extrema are projected
 * from the typical event spacing and average high/low levels.
 */
export function interpolateTideWindow(
  events: TideEvent[],
  start: Date,
  end: Date,
  numPoints: number = DEFAULT_CURVE_POINTS,
): CurvePoint[] {
  const sorted: ParsedTideEvent[] = [...events]
    .map(event => ({ ...event, time: parseISO(event.time) }))
    .sort((a, b) => a.time.getTime() - b.time.getTime());
  const duration = end.getTime() - start.getTime();
  if (sorted.length < 2 || duration <= 0 || numPoints < 2) return [];

  const gaps = sorted.slice(1).map((event, index) => event.time.getTime() - sorted[index].time.getTime());
  const validGaps = gaps.filter(gap => gap > 0).sort((a, b) => a - b);
  if (validGaps.length === 0) return [];
  const gap = validGaps[Math.floor(validGaps.length / 2)];
  const averageHeight = (type: TideEvent['type']) => {
    const matching = sorted.filter(event => event.type === type);
    if (matching.length === 0) {
      return sorted.reduce((sum, event) => sum + event.height, 0) / sorted.length;
    }
    return matching.reduce((sum, event) => sum + event.height, 0) / matching.length;
  };
  const timeline = [...sorted];

  while (timeline[0].time.getTime() > start.getTime()) {
    const first = timeline[0];
    const type = first.type === 'high' ? 'low' : 'high';
    timeline.unshift({ type, height: averageHeight(type), time: new Date(first.time.getTime() - gap) });
  }
  while (timeline[timeline.length - 1].time.getTime() < end.getTime()) {
    const last = timeline[timeline.length - 1];
    const type = last.type === 'high' ? 'low' : 'high';
    timeline.push({ type, height: averageHeight(type), time: new Date(last.time.getTime() + gap) });
  }

  const points: CurvePoint[] = [];
  let segment = 0;
  for (let i = 0; i < numPoints; i++) {
    const time = new Date(start.getTime() + (duration * i) / (numPoints - 1));
    while (segment < timeline.length - 2 && time.getTime() > timeline[segment + 1].time.getTime()) {
      segment += 1;
    }
    const previous = timeline[segment];
    const next = timeline[segment + 1];
    const fraction = (time.getTime() - previous.time.getTime()) /
      (next.time.getTime() - previous.time.getTime());
    points.push({
      time,
      height: previous.height + (next.height - previous.height) * tideEase(fraction),
    });
  }
  return points;
}

/** Build labels at exact intervals from the beginning of a rolling window. */
export function createRollingTimeLabels(start: Date, end: Date, stepHours = 4): TimeLabel[] {
  const labels: TimeLabel[] = [];
  let hour = 0;
  for (let time = start; time.getTime() <= end.getTime(); time = addHours(time, stepHours)) {
    labels.push({ hour, time, label: format(time, 'HH:mm') });
    hour += stepHours;
  }
  return labels;
}

/**
 * Build time-axis labels every `stepHours` (default 6h) across [start, end].
 * The trailing label is rendered as `24:00` rather than a bare `00:00`, which
 * would otherwise look identical to the (filtered-out) start-of-day tick.
 */
export function createTimeLabels(start: Date, end: Date, stepHours = 6): TimeLabel[] {
  const labels: TimeLabel[] = [];
  const dayStart = startOfDay(start);

  for (let hour = 0; hour <= 24; hour += stepHours) {
    const time = addHours(dayStart, hour);
    if (time.getTime() >= start.getTime() && time.getTime() <= end.getTime()) {
      labels.push({
        hour,
        time,
        label: hour === 24 ? '24:00' : format(time, 'HH:mm'),
      });
    }
  }

  return labels;
}

/**
 * The y-axis domain (min/max height in metres) for the tide graph, padded by
 * ~0.5 m and rounded to whole metres. The lower bound is intentionally **not**
 * clamped at 0: real low tides fall below mean sea level (negative heights) and
 * must appear on the chart rather than being clipped below the baseline.
 *
 * Returns `[0, 1]` for empty input (the graph renders its empty state anyway).
 */
export function computeHeightDomain(heights: number[]): [number, number] {
  if (heights.length === 0) return [0, 1];
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  return [Math.floor(min - 0.5), Math.ceil(max + 0.5)];
}
