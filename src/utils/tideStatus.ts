import { parseISO } from 'date-fns';
import type { TideEvent, TideEventType } from '../types/tide';
import { tideEase } from './tideCurve';

export interface TideStatus {
  height: number;
  direction: 'in' | 'out';
  nextHigh: TideEvent;
  nextLow: TideEvent;
}

const DEFAULT_EVENT_GAP_MS = 6.2 * 60 * 60 * 1000;

function averageHeight(events: TideEvent[], type: TideEventType): number {
  const matching = events.filter(event => event.type === type);
  if (matching.length === 0) return 0;
  return matching.reduce((sum, event) => sum + event.height, 0) / matching.length;
}

function typicalGap(events: TideEvent[]): number {
  const gaps = events
    .slice(1)
    .map((event, index) => parseISO(event.time).getTime() - parseISO(events[index].time).getTime())
    .filter(gap => gap > 0);

  if (gaps.length === 0) return DEFAULT_EVENT_GAP_MS;
  return gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
}

function projectedEvent(
  from: TideEvent,
  events: TideEvent[],
  gapMs: number,
  direction: -1 | 1,
): TideEvent {
  const type: TideEventType = from.type === 'high' ? 'low' : 'high';
  return {
    type,
    height: averageHeight(events, type),
    time: new Date(parseISO(from.time).getTime() + direction * gapMs).toISOString(),
  };
}

/**
 * Estimate the tide at a point in time from the surrounding high/low predictions.
 * Boundary events are projected using the day's typical event gap so the summary
 * remains useful just before the first or after the last listed event.
 */
export function getTideStatus(events: TideEvent[], at: Date = new Date()): TideStatus | null {
  const sorted = [...events].sort(
    (a, b) => parseISO(a.time).getTime() - parseISO(b.time).getTime(),
  );
  if (sorted.length < 2) return null;

  const gapMs = typicalGap(sorted);
  const timeline = [...sorted];
  while (parseISO(timeline[0].time).getTime() > at.getTime()) {
    timeline.unshift(projectedEvent(timeline[0], sorted, gapMs, -1));
  }

  // Two future extrema guarantee that both the next high and next low are available.
  while (
    timeline.filter(event => parseISO(event.time).getTime() > at.getTime()).length < 2
  ) {
    timeline.push(projectedEvent(timeline[timeline.length - 1], sorted, gapMs, 1));
  }

  const nextIndex = timeline.findIndex(event => parseISO(event.time).getTime() > at.getTime());
  if (nextIndex <= 0) return null;

  const previous = timeline[nextIndex - 1];
  const next = timeline[nextIndex];
  const previousTime = parseISO(previous.time).getTime();
  const nextTime = parseISO(next.time).getTime();
  const fraction = (at.getTime() - previousTime) / (nextTime - previousTime);
  const height = previous.height + (next.height - previous.height) * tideEase(fraction);

  let nextHigh = timeline.slice(nextIndex).find(event => event.type === 'high');
  let nextLow = timeline.slice(nextIndex).find(event => event.type === 'low');
  while (!nextHigh || !nextLow) {
    timeline.push(projectedEvent(timeline[timeline.length - 1], sorted, gapMs, 1));
    nextHigh = timeline.slice(nextIndex).find(event => event.type === 'high');
    nextLow = timeline.slice(nextIndex).find(event => event.type === 'low');
  }

  return {
    height,
    direction: next.type === 'high' ? 'in' : 'out',
    nextHigh,
    nextLow,
  };
}

export function formatTimeUntil(target: string, from: Date = new Date()): string {
  const totalMinutes = Math.max(0, Math.round((parseISO(target).getTime() - from.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
}
