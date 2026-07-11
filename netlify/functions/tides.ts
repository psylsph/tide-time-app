import type { TideEvent } from '../../src/types/tide';
import { ukTideStations } from '../../src/data/ukTideStations';

/**
 * Netlify Function: live UK tide data proxy.
 *
 * The frontend is a static bundle and cannot hold a secret API key, so this
 * serverless function acts as the trusted proxy. It looks up a station's
 * coordinates from the shared station dataset, calls the Stormglass tide
 * "extremes" endpoint (high/low waters) for the requested day, and returns
 * normalized `TideEvent[]`.
 *
 * Budget: Stormglass allows ~10 requests/day on the plan in use. Tide
 * predictions are stable, so successful responses are cached at the CDN for a
 * week per (station, date) — repeated lookups never hit Stormglass. Any error
 * (quota exhausted, upstream failure, missing key) returns a non-cacheable
 * error so the client falls back to its deterministic demo data.
 */

const STORMGLASS_EXTREMES_URL = 'https://api.stormglass.io/v2/tide/extremes/point';
const SECONDS_PER_DAY = 24 * 60 * 60;
const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Look up a station by id. */
export function getStationById(stationId: string) {
  return ukTideStations.find(s => s.id === stationId);
}

/** Convert a `YYYY-MM-DD` string to a UTC unix-seconds day range. */
export function dateToUnixDayRange(dateStr: string): { start: number; end: number } {
  const start = Math.floor(Date.parse(`${dateStr}T00:00:00Z`) / 1000);
  return { start, end: start + SECONDS_PER_DAY };
}

/** Build the Stormglass extremes request URL. */
export function buildStormglassUrl(
  lat: number,
  lng: number,
  start: number,
  end: number,
): string {
  return `${STORMGLASS_EXTREMES_URL}?lat=${lat}&lng=${lng}&start=${start}&end=${end}`;
}

interface StormglassExtreme {
  height: number;
  time: string;
  type: string;
}

/** Normalize a Stormglass extremes payload into TideEvent[]. */
export function normaliseStormglassExtremes(payload: unknown): TideEvent[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = (payload as { data?: StormglassExtreme[] }).data;
  if (!Array.isArray(data)) return [];

  const events: TideEvent[] = [];
  for (const item of data) {
    if (!item) continue;
    if (typeof item.height !== 'number') continue;
    if (typeof item.time !== 'string') continue;
    if (item.type !== 'high' && item.type !== 'low') continue;
    events.push({ type: item.type, time: item.time, height: item.height });
  }
  return events;
}

function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

/** @returns today's date as `YYYY-MM-DD` (UTC). */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const ERROR_CACHE_HEADERS = { 'cache-control': 'no-store' };
const SUCCESS_CACHE_HEADERS = {
  // Predictions are stable: cache a day client-side, a week at the CDN, and
  // serve stale for up to a day while revalidating. This is the protection
  // that keeps us inside the 10 calls/day Stormglass quota.
  'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
  'x-tide-source': 'live',
};

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const stationId = (url.searchParams.get('stationId') ?? '').trim();
  const dateParam = (url.searchParams.get('date') ?? '').trim();

  const station = getStationById(stationId);
  if (!station) {
    return jsonResponse({ error: 'unknown-station', stationId }, 404, ERROR_CACHE_HEADERS);
  }

  const apiKey = (process.env as Record<string, string | undefined>).STORMGLASS_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'no-api-key' }, 503, ERROR_CACHE_HEADERS);
  }

  const dateStr = ISO_DAY_RE.test(dateParam) ? dateParam : todayIso();
  const { start, end } = dateToUnixDayRange(dateStr);

  try {
    const upstream = await fetch(buildStormglassUrl(station.latitude, station.longitude, start, end), {
      headers: { Authorization: apiKey },
    });

    if (!upstream.ok) {
      // Quota exhausted (402/429) or other upstream error. Do not cache: the
      // client will fall back to demo data, and a later retry can succeed.
      return jsonResponse(
        { error: 'upstream', status: upstream.status },
        upstream.status === 402 || upstream.status === 429 ? 502 : 502,
        ERROR_CACHE_HEADERS,
      );
    }

    const events = normaliseStormglassExtremes(await upstream.json());
    if (events.length === 0) {
      return jsonResponse({ error: 'empty' }, 502, ERROR_CACHE_HEADERS);
    }

    return jsonResponse(
      { source: 'live', stationId, date: dateStr, events },
      200,
      SUCCESS_CACHE_HEADERS,
    );
  } catch (err) {
    return jsonResponse(
      { error: 'fetch-failed', message: err instanceof Error ? err.message : String(err) },
      502,
      ERROR_CACHE_HEADERS,
    );
  }
}
