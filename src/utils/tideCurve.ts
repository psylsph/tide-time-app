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
