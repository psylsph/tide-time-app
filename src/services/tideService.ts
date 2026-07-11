import { format } from 'date-fns';
import type { TideDataResult, TideEvent } from '../types/tide';
import { TIDES_ENDPOINT } from '../config/api';
import { TIDAL_PERIOD_MIN } from '../config/layout';

/**
 * Tide data service.
 *
 * Primary source: a Netlify Function (`netlify/functions/tides.ts`) that proxies
 * the live Stormglass tide API, keyed on `(stationId, date)`. The function is
 * CDN-cached per station+day for a week, which is what keeps us inside
 * Stormglass's ~10 calls/day quota.
 *
 * If the function is unreachable or returns an error (e.g. quota exhausted),
 * we fall back to deterministic demo data so the app always works. The result's
 * `source` field tells the UI whether to show a "demo data" badge.
 */

// ---------------------------------------------------------------------------
// Deterministic DEMO model (fallback). The same (stationId, date) always yields
// the same events; different stations produce different tidal phases/heights.
// ---------------------------------------------------------------------------

const MIN_PER_DAY = 24 * 60;

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Generate deterministic demo tide events for a station on a given day. */
export function getDemoTideData(stationId: string, date: Date = new Date()): TideEvent[] {
  const stationRand = mulberry32(hashSeed(stationId));
  const firstEventOffset = Math.floor(stationRand() * TIDAL_PERIOD_MIN);
  const firstEventIsHigh = stationRand() < 0.5;
  const meanHigh = 3.0 + stationRand() * 4.0; // 3.0..7.0 m
  const highAmp = 0.4 + stationRand() * 0.8;
  const meanLow = 0.2 + stationRand() * 1.2; // 0.2..1.4 m
  const lowAmp = 0.2 + stationRand() * 0.5;

  const dayKey = `${stationId}|${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const dayRand = mulberry32(hashSeed(dayKey));

  const events: TideEvent[] = [];
  let minute = firstEventOffset;
  let isHigh = firstEventIsHigh;

  while (minute < MIN_PER_DAY) {
    const baseline = isHigh ? meanHigh : meanLow;
    const amp = isHigh ? highAmp : lowAmp;
    const jittered = baseline + (dayRand() * 2 - 1) * amp;

    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    eventDate.setMinutes(minute);

    events.push({
      type: isHigh ? 'high' : 'low',
      time: eventDate.toISOString(),
      height: Math.max(0, round1(jittered)),
    });

    isHigh = !isHigh;
    minute += TIDAL_PERIOD_MIN;
  }

  return events;
}

// ---------------------------------------------------------------------------
// Live fetch (with demo fallback + per-session cache).
// ---------------------------------------------------------------------------

/** Per-session cache so re-selecting the same station/day never re-invokes. */
const liveCache = new Map<string, TideDataResult>();

interface TidesResponseBody {
  source?: unknown;
  events?: unknown;
}

function isLiveBody(body: TidesResponseBody): body is { source: 'live'; events: TideEvent[] } {
  return body.source === 'live' && Array.isArray(body.events) && body.events.length > 0;
}

/**
 * Fetch tide data for a station/day. Returns `{source:'live'}` on success, or
 * falls back to `{source:'demo'}` on any error. Successful live results are
 * cached for the session; demo fallbacks are not (so a retry can go live).
 */
export async function getTideData(
  stationId: string,
  date: Date = new Date(),
): Promise<TideDataResult> {
  const dateKey = format(date, 'yyyy-MM-dd');
  const cacheKey = `${stationId}|${dateKey}`;

  const cached = liveCache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `${TIDES_ENDPOINT}?stationId=${encodeURIComponent(stationId)}&date=${dateKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`tides endpoint responded ${res.status}`);
    const body = (await res.json()) as TidesResponseBody;
    if (!isLiveBody(body)) throw new Error('unexpected response payload');

    const result: TideDataResult = { source: 'live', events: body.events };
    liveCache.set(cacheKey, result);
    return result;
  } catch {
    return { source: 'demo', events: getDemoTideData(stationId, date) };
  }
}

/** Exposed for tests: clear the per-session live cache. */
export function __clearTideCacheForTests(): void {
  liveCache.clear();
}
